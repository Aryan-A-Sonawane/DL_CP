import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/db";
import EmployeeDashboardClient from "@/components/EmployeeDashboardClient";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYEE") redirect("/dashboard");

  const [latest, history, records] = await Promise.all([
    withRetry(() => prisma.roleSuggestion.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })),
    withRetry(() => prisma.roleSuggestion.findMany({
      where: { userId: user.id },
      orderBy: { cycleStart: "asc" },
      take: 12,
    })),
    withRetry(() => prisma.performanceRecord.findMany({
      where: { userId: user.id },
      orderBy: { cycleStart: "asc" },
      take: 12,
    })),
  ]);

  // Build serializable props (no Date objects across the server→client boundary)
  const historySer = history.map((h) => ({
    id: h.id,
    cycleStart:       h.cycleStart.toISOString(),
    cycleEnd:         h.cycleEnd.toISOString(),
    suggestedRole:    h.suggestedRole,
    matchScore:       h.matchScore,
    failureScore:     h.failureScore,
    resilienceIndex:  h.resilienceIndex,
    leadershipScore:  h.leadershipScore,
    growthTrajectory: h.growthTrajectory,
    explanation:      h.explanation ?? null,
    featureImportance: h.featureImportance ?? null,
  }));

  const latestSer = historySer.at(-1) ?? null;

  const recordsSer = records.map((r) => {
    const productivity = r.hoursPerCycle > 0
      ? Math.round((r.hoursWorked / r.hoursPerCycle) * 1000) / 10
      : 0;
    const errorRate = r.hoursWorked > 0
      ? Math.round((r.defects / r.hoursWorked) * 10000) / 100
      : 0;
    return {
      cycle:       r.cycleStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
      hours:       r.hoursWorked,
      defects:     r.defects,
      tat:         r.avgTurnAroundHours,
      productivity,
      errorRate,
    };
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">
          Hi {user.name.split(" ")[0]} 👋
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Your latest analysis and progression in {user.department?.name ?? "your department"}.
          {" "}<span className="text-primary-600 font-medium">Click ⓘ on any score</span> to understand how it was calculated.
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
        <EmployeeDashboardClient
          latest={latestSer}
          history={historySer}
          records={recordsSer}
          userName={user.name}
          deptName={user.department?.name ?? "your department"}
        />
      )}
    </div>
  );
}
