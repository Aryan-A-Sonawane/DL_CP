import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DepartmentsClient from "./DepartmentsClient";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !user.orgId) redirect("/dashboard");

  const depts = await prisma.department.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      head: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, projects: true } },
    },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Departments</h2>
          <p className="mt-1 text-sm text-surface-500">
            Create departments, invite their heads, configure productivity cycles.
          </p>
        </div>
      </div>

      {depts.length === 0 && (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Building2 size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            You haven&apos;t created any departments yet. Use the form below to add one.
          </p>
        </div>
      )}

      <DepartmentsClient initial={depts.map((d) => ({
        id: d.id,
        name: d.name,
        cycleType: d.cycleType,
        cycleLengthDays: d.cycleLengthDays,
        head: d.head,
        memberCount: d._count.members,
        projectCount: d._count.projects,
      }))} />
    </div>
  );
}
