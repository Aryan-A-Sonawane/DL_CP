import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export const runtime = "nodejs";

/**
 * DELETE /api/dept/assignments/[id]
 *
 * Ends a project assignment (project change, employment cancelled, etc.).
 * - DEPT_HEAD: only assignments inside their own department
 * - ADMIN:     any assignment inside their organization
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["DEPT_HEAD", "ADMIN"], async (user) => {
    const { id } = await params;
    const assignmentId = Number(id);
    const a = await prisma.projectAssignment.findUnique({
      where: { id: assignmentId },
      include: { project: { include: { department: { select: { orgId: true } } } } },
    });
    if (!a) return { error: "Assignment not found." };

    if (user.role === "DEPT_HEAD") {
      if (a.project.departmentId !== user.departmentId) {
        return { error: "Assignment is not in your department." };
      }
    } else {
      if (a.project.department.orgId !== user.orgId) {
        return { error: "Assignment is not in your organization." };
      }
    }

    if (a.endedAt) return { ok: true, alreadyEnded: true };

    await prisma.projectAssignment.update({
      where: { id: assignmentId },
      data: { endedAt: new Date() },
    });
    return { ok: true };
  });
}
