import { redirect } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrgRowActions from "./OrgRowActions";

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, departments: true } },
      users: {
        where: { role: "ADMIN" },
        select: { name: true, email: true },
        take: 1,
      },
    },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Organizations</h2>
        <p className="mt-1 text-sm text-surface-500">
          All tenants on the platform. Suspend or rename as needed.
        </p>
      </div>

      {orgs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Building2 size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No organizations yet — invite a customer to register from the landing page.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Admin contact</th>
                <th>Members</th>
                <th>Departments</th>
                <th>Created</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="font-semibold text-surface-900">{o.name}</div>
                    <div className="text-xs text-surface-400 font-mono">{o.slug}</div>
                  </td>
                  <td>
                    {o.users[0] ? (
                      <>
                        <div className="text-surface-700">{o.users[0].name}</div>
                        <div className="text-xs text-surface-400">{o.users[0].email}</div>
                      </>
                    ) : (
                      <span className="text-surface-400">—</span>
                    )}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-surface-700">
                      <Users size={13} className="text-surface-400" />
                      {o._count.users}
                    </span>
                  </td>
                  <td>{o._count.departments}</td>
                  <td>{o.createdAt.toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${o.active ? "badge-emerald" : "badge-red"}`}>
                      {o.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="text-right">
                    <OrgRowActions orgId={o.id} active={o.active} name={o.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
