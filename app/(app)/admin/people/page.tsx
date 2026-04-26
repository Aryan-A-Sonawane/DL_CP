import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PeopleClient, { type PersonRow } from "./PeopleClient";
import ImportEmployeesButton from "./ImportEmployeesButton";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !user.orgId) redirect("/dashboard");

  const people = await prisma.user.findMany({
    where: { orgId: user.orgId, role: { not: "ADMIN" } },
    include: { department: { select: { id: true, name: true } } },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
  });

  const rows: PersonRow[] = people.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as "DEPT_HEAD" | "EMPLOYEE",
    departmentId: p.department?.id ?? null,
    departmentName: p.department?.name ?? null,
    profileComplete: p.profileComplete,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  }));

  const orgName = user.organization?.name ?? "your organization";

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">People</h2>
          <p className="mt-1 text-sm text-surface-500">
            Everyone in {orgName}, by role and department. Demote heads,
            deactivate departures, or reactivate returning members.
          </p>
        </div>
        <ImportEmployeesButton organizationName={orgName} />
      </div>

      {rows.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Users size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No members yet — invite department heads from the Departments page,
            or use <strong>Import employees</strong> above to bulk add from
            Excel.
          </p>
        </div>
      ) : (
        <PeopleClient initial={rows} />
      )}
    </div>
  );
}
