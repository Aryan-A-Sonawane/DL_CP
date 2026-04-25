import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function DeptProjects() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD" || !user.departmentId) redirect("/dashboard");

  const [projects, members] = await Promise.all([
    prisma.project.findMany({
      where: { departmentId: user.departmentId },
      include: {
        assignments: {
          where: { endedAt: null },
          include: { user: { select: { id: true, name: true, empCode: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { departmentId: user.departmentId, role: "EMPLOYEE", active: true },
      select: { id: true, name: true, empCode: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Projects</h2>
        <p className="mt-1 text-sm text-surface-500">
          Create projects, assign people. Re-assigning someone surfaces a warning so the
          relocation isn&apos;t accidental.
        </p>
      </div>

      <ProjectsClient
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          assignments: p.assignments.map((a) => ({
            id: a.id,
            userId: a.userId,
            userName: a.user.name,
            empCode: a.user.empCode,
          })),
        }))}
        members={members}
      />
    </div>
  );
}
