import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/departments/[id]/head
 *
 * Removes the current head of a department. The user is demoted from
 * DEPT_HEAD to EMPLOYEE but stays in the same department so they keep
 * their assignments and historical data.
 *
 * Optional query / body flag `?keepRole=true` keeps them as DEPT_HEAD
 * (just clears the headship link) — useful when reassigning to another
 * dept where they will become head again.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["ADMIN"], async (user) => {
    const { id } = await params;
    const departmentId = Number(id);
    if (!Number.isFinite(departmentId)) return { error: "Invalid department id." };

    const url = new URL(req.url);
    const keepRole = url.searchParams.get("keepRole") === "true";

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { head: true },
    });
    if (!dept || dept.orgId !== user.orgId) {
      return { error: "Department not found in your organization." };
    }
    if (!dept.head) return { error: "This department has no head to remove." };

    const headId = dept.head.id;

    await prisma.$transaction([
      prisma.department.update({
        where: { id: departmentId },
        data: { headId: null },
      }),
      ...(keepRole
        ? []
        : [
            prisma.user.update({
              where: { id: headId },
              data: { role: "EMPLOYEE" },
            }),
          ]),
    ]);

    return { ok: true, demotedUserId: headId, keptRole: keepRole };
  });
}
