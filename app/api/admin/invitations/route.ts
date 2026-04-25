import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";
import { generateInviteCode } from "@/lib/auth";
import { sendInviteEmail, emailEnabled } from "@/lib/email";

export const runtime = "nodejs";

const VALID_ROLES = ["EMPLOYEE", "DEPT_HEAD"] as const;

export async function POST(req: NextRequest) {
  return withAuth(["ADMIN", "DEPT_HEAD"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "EMPLOYEE") as (typeof VALID_ROLES)[number];
    const departmentId = body?.departmentId ? Number(body.departmentId) : null;

    if (!email.includes("@")) return { error: "Valid email required." };
    if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };
    if (!user.orgId) return { error: "No organization context." };

    if (user.role === "DEPT_HEAD") {
      if (role !== "EMPLOYEE") return { error: "Department heads can only invite employees." };
      if (!user.departmentId) return { error: "You aren't assigned to a department yet." };
      if (departmentId && departmentId !== user.departmentId) {
        return { error: "You can only invite into your own department." };
      }
    }

    const targetDeptId =
      user.role === "DEPT_HEAD" ? user.departmentId : departmentId;

    let targetDept: { id: number; name: string; orgId: number; headId: number | null } | null = null;
    if (targetDeptId) {
      targetDept = await prisma.department.findUnique({
        where: { id: targetDeptId },
        select: { id: true, name: true, orgId: true, headId: true },
      });
      if (!targetDept || targetDept.orgId !== user.orgId) {
        return { error: "Department not found in your organization." };
      }
    }

    // ── Existing user? Reassign / reactivate in place instead of erroring out.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.orgId !== user.orgId) {
        return {
          error:
            "This email belongs to someone in another organization. Use a different email.",
        };
      }
      if (existingUser.role === "ADMIN" || existingUser.role === "SUPER_ADMIN") {
        return {
          error:
            "This email belongs to an Admin or Super Admin and cannot be re-assigned here.",
        };
      }

      if (user.role === "DEPT_HEAD") {
        if (
          existingUser.departmentId &&
          existingUser.departmentId !== user.departmentId
        ) {
          return {
            error:
              "This person is currently in another department. Ask an Admin to move them first.",
          };
        }
        if (existingUser.role === "DEPT_HEAD") {
          return {
            error:
              "This person is a Department Head. Ask an Admin to remove their headship first.",
          };
        }
      }

      const isSamePosition =
        existingUser.active &&
        existingUser.role === role &&
        existingUser.departmentId === (targetDeptId ?? null);
      if (isSamePosition) {
        return {
          error:
            "This person is already active in that role and department — nothing to do.",
        };
      }

      if (role === "DEPT_HEAD" && targetDept?.headId && targetDept.headId !== existingUser.id) {
        return { error: "This department already has a head — remove them first." };
      }

      const movingDepartments =
        existingUser.departmentId !== null &&
        existingUser.departmentId !== (targetDeptId ?? null);

      const ops: Prisma.PrismaPromise<unknown>[] = [];

      ops.push(
        prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role,
            departmentId: targetDeptId ?? null,
            active: true,
          },
        }),
      );

      if (movingDepartments) {
        ops.push(
          prisma.projectAssignment.updateMany({
            where: { userId: existingUser.id, endedAt: null },
            data: { endedAt: new Date() },
          }),
        );
        if (
          existingUser.role === "DEPT_HEAD" &&
          existingUser.departmentId !== null
        ) {
          ops.push(
            prisma.department.update({
              where: { id: existingUser.departmentId },
              data: { headId: null },
            }),
          );
        }
      }

      if (role === "DEPT_HEAD" && targetDept) {
        ops.push(
          prisma.department.update({
            where: { id: targetDept.id },
            data: { headId: existingUser.id },
          }),
        );
      } else if (existingUser.role === "DEPT_HEAD" && role === "EMPLOYEE") {
        const headed = await prisma.department.findFirst({
          where: { headId: existingUser.id },
          select: { id: true },
        });
        if (headed) {
          ops.push(
            prisma.department.update({
              where: { id: headed.id },
              data: { headId: null },
            }),
          );
        }
      }

      await prisma.$transaction(ops);

      const wasInactive = !existingUser.active;
      const wasPromoted = existingUser.role !== role;
      const wasMoved = movingDepartments;

      const summary = wasInactive
        ? `${existingUser.name} has been reactivated`
        : wasPromoted || wasMoved
          ? `${existingUser.name}'s position has been updated`
          : `${existingUser.name} has been updated`;

      return {
        ok: true,
        reused: true,
        userId: existingUser.id,
        userName: existingUser.name,
        wasInactive,
        wasPromoted,
        wasMoved,
        newRole: role,
        newDepartmentName: targetDept?.name ?? null,
        summary,
      };
    }

    // ── Brand new email → traditional invitation + email flow.
    if (role === "DEPT_HEAD" && targetDept?.headId) {
      return { error: "This department already has a head — remove them first." };
    }

    let code = generateInviteCode();
    for (let i = 0; i < 5 && (await prisma.invitation.findUnique({ where: { code } })); i++) {
      code = generateInviteCode();
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const invite = await prisma.invitation.create({
      data: {
        orgId: user.orgId,
        email,
        code,
        role,
        departmentId: targetDeptId ?? null,
        invitedById: user.id,
        expiresAt,
      },
    });

    let emailStatus: "sent" | "skipped" | "failed" = "skipped";
    let emailError: string | undefined;

    if (emailEnabled()) {
      const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
      const result = await sendInviteEmail({
        to: email,
        code: invite.code,
        organizationName: org?.name ?? "your organization",
        departmentName: targetDept?.name ?? null,
        role,
        invitedByName: user.name,
        invitedByEmail: user.email,
        expiresAt,
      });
      emailStatus = result.ok ? "sent" : "failed";
      if (!result.ok) emailError = result.reason;
    }

    return { ok: true, code: invite.code, expiresAt, emailStatus, emailError };
  });
}

export async function GET() {
  return withAuth(["ADMIN", "DEPT_HEAD"], async (user) => {
    if (!user.orgId) return [];
    const where: { orgId: number; departmentId?: number } = { orgId: user.orgId };
    if (user.role === "DEPT_HEAD" && user.departmentId) where.departmentId = user.departmentId;
    return prisma.invitation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });
}
