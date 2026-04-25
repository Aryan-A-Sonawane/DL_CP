import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["DEPT_HEAD"], async (user) => {
    if (!user.departmentId) return NextResponse.json({ error: "No department." }, { status: 400 });
    const { id } = await params;
    const projectId = Number(id);
    const body = await req.json().catch(() => ({}));
    const userId = Number(body?.userId);
    const confirmFlag = Boolean(body?.confirm);

    if (!projectId || !userId) {
      return NextResponse.json({ error: "projectId & userId required." }, { status: 400 });
    }

    const [project, target] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!project || project.departmentId !== user.departmentId) {
      return NextResponse.json({ error: "Project not in your department." }, { status: 404 });
    }
    if (!target || target.departmentId !== user.departmentId) {
      return NextResponse.json({ error: "Person not in your department." }, { status: 400 });
    }

    const active = await prisma.projectAssignment.findMany({
      where: { userId, endedAt: null },
      include: { project: { select: { id: true, name: true } } },
    });
    const otherActive = active.filter((a) => a.projectId !== projectId);
    if (otherActive.length > 0 && !confirmFlag) {
      return NextResponse.json(
        {
          warning: {
            user: target.name,
            currentProjects: otherActive.map((a) => a.project.name),
          },
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (otherActive.length > 0) {
        await tx.projectAssignment.updateMany({
          where: { id: { in: otherActive.map((a) => a.id) } },
          data: { endedAt: new Date() },
        });
      }
      const dup = await tx.projectAssignment.findFirst({
        where: { projectId, userId, endedAt: null },
      });
      if (!dup) {
        await tx.projectAssignment.create({ data: { projectId, userId } });
      }
    });

    return NextResponse.json({ ok: true });
  });
}
