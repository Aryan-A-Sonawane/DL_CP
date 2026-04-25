import { NextRequest } from "next/server";
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
    const role = String(body?.role ?? "EMPLOYEE");
    const departmentId = body?.departmentId ? Number(body.departmentId) : null;

    if (!email.includes("@")) return { error: "Valid email required." };
    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return { error: "Invalid role." };
    }
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

    if (targetDeptId) {
      const dept = await prisma.department.findUnique({ where: { id: targetDeptId } });
      if (!dept || dept.orgId !== user.orgId) {
        return { error: "Department not found in your organization." };
      }
      if (role === "DEPT_HEAD" && dept.headId) {
        return { error: "This department already has a head — replace from the dept page." };
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "A user with this email already exists." };

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
      const dept = targetDeptId
        ? await prisma.department.findUnique({ where: { id: targetDeptId } })
        : null;
      const result = await sendInviteEmail({
        to: email,
        code: invite.code,
        organizationName: org?.name ?? "your organization",
        departmentName: dept?.name ?? null,
        role: role as "EMPLOYEE" | "DEPT_HEAD",
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
