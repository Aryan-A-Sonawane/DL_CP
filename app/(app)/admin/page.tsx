import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  GitBranch,
  Brain,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !user.orgId) redirect("/dashboard");
  const orgId = user.orgId;

  const [deptCount, memberCount, projectCount, suggestionCount, depts, recentInvites] =
    await Promise.all([
      prisma.department.count({ where: { orgId } }),
      prisma.user.count({ where: { orgId, role: { not: "ADMIN" } } }),
      prisma.project.count({ where: { department: { orgId } } }),
      prisma.roleSuggestion.count({ where: { user: { orgId } } }),
      prisma.department.findMany({
        where: { orgId },
        include: {
          head: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, projects: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invitation.findMany({
        where: { orgId, used: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { invitedBy: { select: { name: true } } },
      }),
    ]);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">{user.organization?.name}</h2>
        <p className="mt-1 text-sm text-surface-500">
          Org-wide health, departments and engine activity.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Building2} label="Departments" value={deptCount} colorClass="stat-card-indigo" iconBg="bg-primary-50" iconColor="text-primary-500" />
        <Stat icon={Users} label="People" value={memberCount} colorClass="stat-card-emerald" iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <Stat icon={GitBranch} label="Projects" value={projectCount} colorClass="stat-card-violet" iconBg="bg-violet-50" iconColor="text-violet-500" />
        <Stat icon={Brain} label="Role suggestions" value={suggestionCount} colorClass="stat-card-amber" iconBg="bg-amber-50" iconColor="text-amber-500" />
      </section>

      <section className="card p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-surface-900">Departments</h3>
            <p className="text-sm text-surface-500 mt-1">
              Each department has its own dept-head, projects, cycle configuration and uploads.
            </p>
          </div>
          <Link href="/admin/departments" className="btn-primary inline-flex items-center gap-2">
            Manage departments
          </Link>
        </div>
        {depts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Building2 size={28} className="text-surface-300" />
            <p className="mt-3 text-sm text-surface-500">
              No departments yet — create your first one and invite a department head.
            </p>
            <Link
              href="/admin/departments"
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              Create department
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {depts.map((d) => (
              <div key={d.id} className="card-soft p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-surface-900">{d.name}</h4>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {d.cycleType} · {d.cycleLengthDays}d cycle
                    </p>
                  </div>
                  <span className="badge badge-indigo">
                    {d._count.members} {d._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
                <div className="mt-3 text-sm">
                  <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">
                    Department head
                  </p>
                  {d.head ? (
                    <p className="text-surface-700 mt-1">
                      {d.head.name}{" "}
                      <span className="text-surface-400 text-xs">· {d.head.email}</span>
                    </p>
                  ) : (
                    <p className="text-amber-600 text-xs mt-1">
                      Not assigned yet — invite a head from the Departments page.
                    </p>
                  )}
                </div>
                <p className="mt-3 text-xs text-surface-400">
                  {d._count.projects} {d._count.projects === 1 ? "project" : "projects"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-8">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Pending invitations</h3>
        {recentInvites.length === 0 ? (
          <p className="text-sm text-surface-400">No outstanding invitations.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Code</th>
                  <th>Invited by</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {recentInvites.map((i) => (
                  <tr key={i.id}>
                    <td>{i.email}</td>
                    <td>
                      <span className="badge badge-violet">{i.role}</span>
                    </td>
                    <td className="font-mono text-xs">{i.code}</td>
                    <td>{i.invitedBy.name}</td>
                    <td>{i.expiresAt.toLocaleDateString()}</td>
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
