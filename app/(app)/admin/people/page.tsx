import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !user.orgId) redirect("/dashboard");

  const people = await prisma.user.findMany({
    where: { orgId: user.orgId, role: { not: "ADMIN" } },
    include: { department: { select: { name: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">People</h2>
        <p className="mt-1 text-sm text-surface-500">
          Everyone in {user.organization?.name}, by role and department.
        </p>
      </div>

      {people.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Users size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No members yet — invite department heads from the Departments page.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Profile</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-surface-900">{p.name}</td>
                  <td>{p.email}</td>
                  <td>
                    <span className={`badge ${p.role === "DEPT_HEAD" ? "badge-violet" : "badge-indigo"}`}>
                      {p.role}
                    </span>
                  </td>
                  <td>{p.department?.name ?? "—"}</td>
                  <td>
                    <span className={`badge ${p.profileComplete ? "badge-emerald" : "badge-amber"}`}>
                      {p.profileComplete ? "Complete" : "Incomplete"}
                    </span>
                  </td>
                  <td>{p.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
