import { redirect } from "next/navigation";
import {
  Globe2,
  Users,
  Building2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SuperOverviewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const [orgs, totalUsers, totalDepts, totalSuggestions] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.department.count(),
    prisma.roleSuggestion.count(),
  ]);

  const recentOrgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { _count: { select: { users: true, departments: true } } },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Platform overview</h2>
        <p className="mt-1 text-sm text-surface-500">
          Tenants, members and engine activity across the platform.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Globe2} label="Organizations" value={orgs} colorClass="stat-card-indigo" iconBg="bg-primary-50" iconColor="text-primary-500" />
        <Stat icon={Users} label="Members (all orgs)" value={totalUsers} colorClass="stat-card-emerald" iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <Stat icon={Building2} label="Departments" value={totalDepts} colorClass="stat-card-violet" iconBg="bg-violet-50" iconColor="text-violet-500" />
        <Stat icon={ShieldCheck} label="Role suggestions issued" value={totalSuggestions} colorClass="stat-card-amber" iconBg="bg-amber-50" iconColor="text-amber-500" />
      </section>

      <section className="card p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-surface-900">Recent organizations</h3>
            <p className="text-sm text-surface-500 mt-1">
              The newest tenants on the platform.
            </p>
          </div>
        </div>
        {recentOrgs.length === 0 ? (
          <EmptyState message="No organizations on the platform yet." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Industry</th>
                  <th>Members</th>
                  <th>Departments</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrgs.map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold text-surface-900">{o.name}</td>
                    <td className="font-mono text-xs text-surface-500">{o.slug}</td>
                    <td>{o.industry || "—"}</td>
                    <td>{o._count.users}</td>
                    <td>{o._count.departments}</td>
                    <td>{o.createdAt.toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${o.active ? "badge-emerald" : "badge-red"}`}>
                        {o.active ? "Active" : "Suspended"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  colorClass,
  iconBg,
  iconColor,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  colorClass: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{value}</p>
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-surface-400">
      {message}
    </div>
  );
}
