import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export const runtime = "nodejs";

/**
 * POST /api/admin/users/[id]/deactivate
 *
 * Marks a user as inactive (employment cancelled, leave of absence, etc.).
 * - Sets user.active = false  → blocks login (getCurrentUser refuses inactive users)
 * - Ends every open ProjectAssignment for the user (sets endedAt = now)
 * - Clears Department.headId if the user was a head
 *
 * Allowed callers:
 * - ADMIN: any user in their organization
 * - DEPT_HEAD: only EMPLOYEE users in their own department
 *
 * Idempotent — calling on an already-inactive user is a no-op.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["ADMIN", "DEPT_HEAD"], async (caller) => {
    const { id } = await params;
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) return { error: "Invalid user id." };
    if (targetId === caller.id) return { error: "You can't deactivate yourself." };

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      include: { headedDept: { select: { id: true } } },
    });
    if (!target) return { error: "User not found." };
    if (target.orgId !== caller.orgId) {
      return { error: "User is not in your organization." };
    }

    if (caller.role === "DEPT_HEAD") {
      if (target.role !== "EMPLOYEE") {
        return { error: "Department heads can only deactivate employees." };
      }
      if (target.departmentId !== caller.departmentId) {
        return { error: "User is not in your department." };
      }
    }

    if (target.role === "ADMIN" || target.role === "SUPER_ADMIN") {
      return { error: "Use the Super-Admin tools to manage Admins." };
    }

    if (!target.active) {
      return { ok: true, alreadyInactive: true };
    }

    const operations = [
      prisma.user.update({
        where: { id: targetId },
        data: { active: false },
      }),
      prisma.projectAssignment.updateMany({
        where: { userId: targetId, endedAt: null },
        data: { endedAt: new Date() },
      }),
    ];

    if (target.headedDept) {
      operations.push(
        prisma.department.update({
          where: { id: target.headedDept.id },
          data: { headId: null },
        }) as never,
      );
    }

    await prisma.$transaction(operations);
    return { ok: true };
  });
}
