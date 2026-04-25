import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ComplianceAudit() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const audits = await prisma.ethicalAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { suggestion: { include: { user: { select: { name: true, email: true } } } } },
  });

  const byFramework = audits.reduce<Record<string, number>>((acc, a) => {
    acc[a.framework] = (acc[a.framework] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Ethical compliance audit</h2>
        <p className="mt-1 text-sm text-surface-500">
          PASSIONIT (9 dimensions) + PRUTL (5 dimensions). No demographic data is ever used in
          analysis.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-soft p-5">
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">PASSIONIT</p>
          <p className="text-2xl font-extrabold text-surface-900 mt-1">
            {byFramework.PASSIONIT ?? 0}
          </p>
          <p className="text-xs text-surface-400 mt-1">recent dimension scores</p>
        </div>
        <div className="card-soft p-5">
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">PRUTL</p>
          <p className="text-2xl font-extrabold text-surface-900 mt-1">
            {byFramework.PRUTL ?? 0}
          </p>
          <p className="text-xs text-surface-400 mt-1">recent dimension scores</p>
        </div>
        <div className="card-soft p-5">
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">Total audits</p>
          <p className="text-2xl font-extrabold text-surface-900 mt-1">{audits.length}</p>
          <p className="text-xs text-surface-400 mt-1">last 100 events shown</p>
        </div>
      </section>

      <section className="card p-8">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={16} className="text-primary-500" />
          <h3 className="text-lg font-bold text-surface-900">Recent audit events</h3>
        </div>
        {audits.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-surface-400">
            No audits have been generated yet.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Framework</th>
                  <th>Dimension</th>
                  <th>Score</th>
                  <th>Risk</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td>{a.createdAt.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-indigo">{a.framework}</span>
                    </td>
                    <td>{a.dimension}</td>
                    <td className="font-semibold text-surface-900">{a.score.toFixed(1)}</td>
                    <td>
                      <span className={`badge badge-${a.riskLevel.toLowerCase()}`}>
                        {a.riskLevel}
                      </span>
                    </td>
                    <td>{a.suggestion?.user?.name ?? "—"}</td>
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
