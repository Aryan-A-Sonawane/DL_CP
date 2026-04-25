import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAudit() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !user.orgId) redirect("/dashboard");

  const audits = await prisma.ethicalAudit.findMany({
    where: { suggestion: { user: { orgId: user.orgId } } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      suggestion: {
        include: { user: { select: { name: true, department: { select: { name: true } } } } },
      },
    },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Audit trail</h2>
        <p className="mt-1 text-sm text-surface-500">
          Per-suggestion ethics audit (PASSIONIT + PRUTL) for this organization.
        </p>
      </div>

      <div className="card p-8">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={16} className="text-primary-500" />
          <h3 className="text-lg font-bold text-surface-900">Latest audits</h3>
        </div>
        {audits.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-surface-400">
            No suggestions audited yet — they appear after engine runs.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Framework</th>
                  <th>Dimension</th>
                  <th>Score</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td>{a.createdAt.toLocaleDateString()}</td>
                    <td>{a.suggestion?.user?.name ?? "—"}</td>
                    <td>{a.suggestion?.user?.department?.name ?? "—"}</td>
                    <td>
                      <span className="badge badge-indigo">{a.framework}</span>
                    </td>
                    <td>{a.dimension}</td>
                    <td className="font-semibold text-surface-900">{a.score.toFixed(1)}</td>
                    <td>
                      <span className={`badge badge-${a.riskLevel.toLowerCase()}`}>{a.riskLevel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
