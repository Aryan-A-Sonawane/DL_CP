import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DeptInviteButton from "./DeptInviteButton";
import PeopleRowActions from "./PeopleRowActions";

export const dynamic = "force-dynamic";

export default async function DeptPeoplePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD" || !user.departmentId) redirect("/dashboard");

  const [people, openInvites] = await Promise.all([
    prisma.user.findMany({
      where: { departmentId: user.departmentId, role: "EMPLOYEE" },
      include: {
        assignments: {
          where: { endedAt: null },
          include: { project: { select: { name: true } } },
        },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.invitation.findMany({
      where: { departmentId: user.departmentId, used: false },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeCount = people.filter((p) => p.active).length;
  const inactiveCount = people.length - activeCount;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">People in your department</h2>
          <p className="mt-1 text-sm text-surface-500">
            Invite employees, manage project assignments, and mark departures.
          </p>
        </div>
        <DeptInviteButton departmentId={user.departmentId} />
      </div>

      {people.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Users size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No employees yet — invite some to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-xs text-surface-500">
            <span className="badge badge-emerald">{activeCount} active</span>
            {inactiveCount > 0 && (
              <span className="badge badge-red">{inactiveCount} inactive</span>
            )}
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Emp ID</th>
                  <th>Email</th>
                  <th>Active projects</th>
                  <th>Profile</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                    <td className="font-semibold text-surface-900">{p.name}</td>
                    <td className="font-mono text-xs">{p.empCode ?? "—"}</td>
                    <td>{p.email}</td>
                    <td>
                      {p.assignments.length === 0 ? (
                        <span className="text-surface-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.assignments.map((a) => (
                            <span key={a.id} className="badge badge-indigo">
                              {a.project.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.profileComplete ? "badge-emerald" : "badge-amber"}`}>
                        {p.profileComplete ? "Complete" : "Incomplete"}
                      </span>
                    </td>
                    <td>
                      <PeopleRowActions
                        userId={p.id}
                        userName={p.name}
                        active={p.active}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-surface-400">
            Tip: to remove someone from a single project (without disabling their
            account), open <strong>Projects</strong> and click the <code>×</code>
            on their name in the project card.
          </p>
        </>
      )}

      {openInvites.length > 0 && (
        <section className="card p-7">
          <h3 className="text-lg font-bold text-surface-900 mb-4">Pending invitations</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Code</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {openInvites.map((i) => (
                  <tr key={i.id}>
                    <td>{i.email}</td>
                    <td className="font-mono text-xs">{i.code}</td>
                    <td>{i.expiresAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
