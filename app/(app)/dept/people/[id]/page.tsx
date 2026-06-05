import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Shield, Brain, Activity, Target, Award,
  AlertTriangle, TrendingUp, Clock, Bug, Zap, type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { employmentTypeLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function EmployeeAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deptHead = await getCurrentUser();
  if (!deptHead || deptHead.role !== "DEPT_HEAD" || !deptHead.departmentId) {
    redirect("/dashboard");
  }

  const targetId = parseInt(id, 10);
  if (isNaN(targetId)) notFound();

  // Verify employee belongs to dept
  const employee = await prisma.user.findFirst({
    where: { id: targetId, departmentId: deptHead.departmentId, role: "EMPLOYEE" },
    include: {
      strengths: { orderBy: { score: "desc" } },
      certifications: { orderBy: { obtainedAt: "desc" }, take: 5 },
      newSkills: { orderBy: { learnedAt: "desc" }, take: 5 },
    },
  });
  if (!employee) notFound();

  const [latestSuggestion, allSuggestions, records, failureEvents] = await Promise.all([
    prisma.roleSuggestion.findFirst({
      where: { userId: targetId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roleSuggestion.findMany({
      where: { userId: targetId },
      orderBy: { cycleStart: "asc" },
      take: 8,
    }),
    prisma.performanceRecord.findMany({
      where: { userId: targetId },
      orderBy: { cycleStart: "desc" },
      take: 10,
    }),
    prisma.failureEvent.findMany({
      where: { userId: targetId },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const featureImportance = parseJSON<Record<string, number>>(latestSuggestion?.featureImportance);

  const trajectoryColor =
    latestSuggestion?.growthTrajectory === "ascending" ? "badge-emerald" :
    latestSuggestion?.growthTrajectory === "descending" ? "badge-red" : "badge-amber";

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dept/people"
            className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-600 transition mb-3"
          >
            <ArrowLeft size={13} />
            Back to People
          </Link>
          <h2 className="text-2xl font-bold text-surface-900">{employee.name}</h2>
          <p className="mt-1 text-sm text-surface-500">
            {employee.empCode ? `#${employee.empCode} · ` : ""}
            {employee.email}
            {employee.primaryDomain ? ` · ${employee.primaryDomain}` : ""}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`badge ${employee.employmentType === "intern" ? "badge-amber" : "badge-indigo"}`}>
            {employmentTypeLabel(employee.employmentType)}
          </span>
          <span className={`badge ${employee.profileComplete ? "badge-emerald" : "badge-amber"}`}>
            Profile {employee.profileComplete ? "complete" : "incomplete"}
          </span>
        </div>
      </div>

      {/* ── Key stat cards ─────────────────────────────────────────────────── */}
      {latestSuggestion ? (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Target} label="Growth Score" value={Math.round(100 - latestSuggestion.failureScore)}
              colorClass="stat-card-emerald" iconBg="bg-emerald-50" iconColor="text-emerald-500" sub="higher is better" />
            <Stat icon={Shield} label="Resilience Index" value={latestSuggestion.resilienceIndex}
              colorClass="stat-card-indigo" iconBg="bg-primary-50" iconColor="text-primary-500" />
            <Stat icon={Brain} label="Leadership Score" value={latestSuggestion.leadershipScore}
              colorClass="stat-card-violet" iconBg="bg-violet-50" iconColor="text-violet-500" />
            <Stat icon={Activity} label="Failure Score" value={latestSuggestion.failureScore}
              colorClass="stat-card-amber" iconBg="bg-amber-50" iconColor="text-amber-500" sub="lower is better" />
          </section>

          {/* ── Role recommendation ──────────────────────────────────────────── */}
          <section className="card p-7">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-surface-900">Latest Role Recommendation</h3>
                <p className="text-sm text-surface-500 mt-1">
                  Based on performance, failure patterns, resilience, and soft skills.
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`badge ${trajectoryColor}`}>
                  {titleCase(latestSuggestion.growthTrajectory)}
                </span>
                <span className="badge badge-indigo">{latestSuggestion.matchScore.toFixed(1)}% match</span>
              </div>
            </div>
            <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5 mb-5">
              <p className="font-semibold text-primary-700">{latestSuggestion.suggestedRole}</p>
              <p className="text-sm text-surface-600 mt-2 leading-relaxed">{latestSuggestion.explanation}</p>
            </div>

            {/* Feature importance bars */}
            {Object.keys(featureImportance).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
                  Why this recommendation
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(featureImportance).slice(0, 8).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="min-w-[140px] truncate text-xs text-surface-600">{k}</span>
                      <div className="h-2 flex-1 rounded-full bg-surface-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-400 to-violet-400"
                          style={{ width: `${v}%` }}
                        />
                      </div>
                      <span className="min-w-[36px] text-right text-xs font-semibold text-primary-600">{v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Zap size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No analysis yet. Upload a cycle report that includes this employee to trigger the engine.
          </p>
        </div>
      )}

      {/* ── Performance records table ──────────────────────────────────────── */}
      {records.length > 0 && (
        <section className="card p-7">
          <h3 className="text-lg font-bold text-surface-900 mb-4">Performance Record History</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Project</th>
                  <th>Hours Worked</th>
                  <th>Defects</th>
                  <th>Avg TAT</th>
                  <th>On Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="text-xs text-surface-500">
                      {r.cycleStart.toLocaleDateString()} → {r.cycleEnd.toLocaleDateString()}
                    </td>
                    <td>{r.projectName ?? <span className="text-surface-400">—</span>}</td>
                    <td>{r.hoursWorked.toFixed(1)} h</td>
                    <td>
                      <span className={`badge ${r.defects === 0 ? "badge-emerald" : r.defects <= 5 ? "badge-amber" : "badge-red"}`}>
                        {r.defects}
                      </span>
                    </td>
                    <td>{r.avgTurnAroundHours > 0 ? `${r.avgTurnAroundHours.toFixed(2)} h` : "—"}</td>
                    <td>
                      <span className={`badge ${r.onTimeSubmission ? "badge-emerald" : "badge-red"}`}>
                        {r.onTimeSubmission ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Failure events timeline ───────────────────────────────────────── */}
      {failureEvents.length > 0 && (
        <section className="card p-7">
          <h3 className="text-lg font-bold text-surface-900 mb-4">Failure Events Timeline</h3>
          <div className="space-y-3">
            {failureEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-4 rounded-xl border border-surface-100 bg-surface-50 p-4">
                <div className="mt-0.5">
                  <AlertTriangle size={15} className={
                    e.severity >= 7 ? "text-red-500" : e.severity >= 5 ? "text-amber-500" : "text-surface-400"
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-indigo text-xs">{titleCase(e.category)}</span>
                    <span className={`badge ${e.outcomeAfter === "improved" ? "badge-emerald" : e.outcomeAfter === "declined" ? "badge-red" : "badge-amber"}`}>
                      {titleCase(e.outcomeAfter)}
                    </span>
                    <span className="text-xs text-surface-400">sev {e.severity.toFixed(1)}</span>
                  </div>
                  {e.description && (
                    <p className="text-xs text-surface-600 mt-1">{e.description}</p>
                  )}
                  <p className="text-xs text-surface-400 mt-1">
                    {e.date.toLocaleDateString()} · recovery ~{e.recoveryTimeDays}d
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Strengths & skills ────────────────────────────────────────────── */}
      {(employee.strengths.length > 0 || employee.certifications.length > 0 || employee.newSkills.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {employee.strengths.length > 0 && (
            <div className="card-soft p-6">
              <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider mb-3">Top Strengths</p>
              <div className="space-y-2">
                {employee.strengths.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-surface-700 truncate">{s.name}</span>
                    <span className="badge badge-indigo shrink-0">{s.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {employee.certifications.length > 0 && (
            <div className="card-soft p-6">
              <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider mb-3">Certifications</p>
              <div className="space-y-2">
                {employee.certifications.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Award size={13} className="text-violet-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-surface-800">{c.name}</p>
                      {c.issuer && <p className="text-xs text-surface-400">{c.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {employee.newSkills.length > 0 && (
            <div className="card-soft p-6">
              <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider mb-3">New Skills</p>
              <div className="flex flex-wrap gap-2">
                {employee.newSkills.map((s) => (
                  <span key={s.id} className="badge badge-violet">{s.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Role suggestion history ─────────────────────────────────────── */}
      {allSuggestions.length > 1 && (
        <section className="card p-7">
          <h3 className="text-lg font-bold text-surface-900 mb-4">Role Suggestion History</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Suggested Role</th>
                  <th>Match</th>
                  <th>Resilience</th>
                  <th>Trajectory</th>
                </tr>
              </thead>
              <tbody>
                {allSuggestions.map((s) => (
                  <tr key={s.id}>
                    <td className="text-xs text-surface-500">{s.cycleStart.toLocaleDateString()}</td>
                    <td className="font-medium text-surface-800">{s.suggestedRole}</td>
                    <td><span className="badge badge-indigo">{s.matchScore.toFixed(1)}%</span></td>
                    <td>{s.resilienceIndex.toFixed(1)}</td>
                    <td>
                      <span className={`badge ${s.growthTrajectory === "ascending" ? "badge-emerald" : s.growthTrajectory === "descending" ? "badge-red" : "badge-amber"}`}>
                        {titleCase(s.growthTrajectory)}
                      </span>
                    </td>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string | null | undefined): T {
  if (!raw) return {} as T;
  try { return JSON.parse(raw); } catch { return {} as T; }
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Stat({
  icon: Icon, label, value, colorClass, iconBg, iconColor, sub,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  colorClass: string;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-surface-400">{sub}</p>}
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
