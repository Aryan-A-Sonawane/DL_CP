import { redirect } from "next/navigation";
import {
  Activity,
  Brain,
  Heart,
  Sparkles,
  Target,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EmployeeProgressChart from "@/components/EmployeeProgressChart";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYEE") redirect("/dashboard");

  const [latest, history, records] = await Promise.all([
    prisma.roleSuggestion.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roleSuggestion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    }),
    prisma.performanceRecord.findMany({
      where: { userId: user.id },
      orderBy: { cycleStart: "asc" },
      take: 12,
    }),
  ]);

  const featureImportance = parseImportance(latest?.featureImportance);

  const chartData = history.map((h) => ({
    cycle: h.cycleStart.toLocaleDateString(),
    resilience: h.resilienceIndex,
    leadership: h.leadershipScore,
    growth: 100 - h.failureScore,
  }));

  const recordTrend = records.map((r) => ({
    cycle: r.cycleStart.toLocaleDateString(),
    hours: r.hoursWorked,
    defects: r.defects,
    tat: r.avgTurnAroundHours,
  }));

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">
          Hi {user.name.split(" ")[0]} 👋
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Your latest analysis and progression in {user.department?.name ?? "your department"}.
        </p>
      </div>

      {!latest ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <Sparkles size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No analysis yet — your department head needs to upload a cycle report first.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Target} label="Growth Score" value={Math.round(100 - latest.failureScore)} colorClass="stat-card-emerald" iconBg="bg-emerald-50" iconColor="text-emerald-500" sub="higher is better" />
            <Stat icon={Shield} label="Resilience" value={latest.resilienceIndex} colorClass="stat-card-indigo" iconBg="bg-primary-50" iconColor="text-primary-500" />
            <Stat icon={Brain} label="Leadership" value={latest.leadershipScore} colorClass="stat-card-violet" iconBg="bg-violet-50" iconColor="text-violet-500" />
            <Stat icon={Activity} label="Trajectory" value={titleCase(latest.growthTrajectory)} colorClass="stat-card-amber" iconBg="bg-amber-50" iconColor="text-amber-500" />
          </section>

          <section className="card p-7">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-surface-900">
                  Recommended growth role
                </h3>
                <p className="text-sm text-surface-500 mt-1">
                  Based on your strengths, recovery patterns and cycle performance.
                </p>
              </div>
              <span className="badge badge-indigo text-base px-3 py-1.5">
                {latest.matchScore.toFixed(1)}% match
              </span>
            </div>
            <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5">
              <p className="font-semibold text-primary-700">{latest.suggestedRole}</p>
              <p className="text-sm text-surface-600 mt-2 leading-relaxed">
                {latest.explanation}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-3 text-xs">
              <Heart size={13} className="text-pink-500" />
              <span className="text-surface-500">
                Share your honest feedback under
                <a href="/employee/feedback" className="text-primary-600 font-semibold ml-1">
                  Role Feedback
                </a>
                {" "}— it helps the model learn your real preferences.
              </span>
            </div>
          </section>

          {Object.keys(featureImportance).length > 0 && (
            <section className="card p-7">
              <h3 className="text-lg font-bold text-surface-900 mb-4">Why this recommendation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(featureImportance).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="min-w-[150px] truncate text-xs text-surface-600">{k}</span>
                    <div className="h-2 flex-1 rounded-full bg-surface-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-violet-400"
                        style={{ width: `${v}%` }}
                      />
                    </div>
                    <span className="min-w-[40px] text-right text-xs font-semibold text-primary-600">
                      {v}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {chartData.length > 1 && (
            <section className="card p-7">
              <h3 className="text-lg font-bold text-surface-900 mb-4">
                Your progress over time
              </h3>
              <EmployeeProgressChart data={chartData} records={recordTrend} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function parseImportance(raw: string | null | undefined): Record<string, number> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Stat({
  icon: Icon,
  label,
  value,
  colorClass,
  iconBg,
  iconColor,
  sub,
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
