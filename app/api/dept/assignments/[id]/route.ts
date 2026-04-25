import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["DEPT_HEAD"], async (user) => {
    const { id } = await params;
    const assignmentId = Number(id);
    const a = await prisma.projectAssignment.findUnique({
      where: { id: assignmentId },
      include: { project: true },
    });
    if (!a || a.project.departmentId !== user.departmentId) {
      return { error: "Assignment not found." };
    }
    await prisma.projectAssignment.update({
      where: { id: assignmentId },
      data: { endedAt: new Date() },
    });
    return { ok: true };
  });
}
