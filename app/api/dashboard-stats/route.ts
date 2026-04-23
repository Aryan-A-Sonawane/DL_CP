import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeFailureScore,
  getFailureCategoryDistribution,
} from "@/lib/engine/failureAnalyzer";
import { computeResilienceIndex } from "@/lib/engine/resilience";
import { computeLeadershipScore } from "@/lib/engine/leadership";
import type { FailureEventInput, StrengthInput } from "@/lib/engine/types";

export async function GET() {
  const employees = await prisma.employee.findMany({
    include: { failureEvents: true, strengths: true },
  });

  const allEvents: FailureEventInput[] = [];
  const scores = employees.map((emp) => {
    const events: FailureEventInput[] = emp.failureEvents.map((e) => ({
      category: e.category,
      severity: e.severity,
      date: e.date,
      recoveryTimeDays: e.recoveryTimeDays,
      outcomeAfter: e.outcomeAfter,
    }));
    allEvents.push(...events);
    const strengths: StrengthInput[] = emp.strengths.map((s) => ({
      name: s.name,
      score: s.score,
      source: s.source,
    }));
    return {
      failure_score: computeFailureScore(events),
      resilience: computeResilienceIndex(events, emp.softSkillScore),
      leadership: computeLeadershipScore(events, strengths, emp.softSkillScore),
    };
  });

  const high = scores.filter((s) => s.failure_score >= 60).length;
  const moderate = scores.filter((s) => s.failure_score >= 30 && s.failure_score < 60).length;
  const low = scores.filter((s) => s.failure_score < 30).length;

  // Top transitions from persisted suggestions
  const suggestions = await prisma.roleSuggestion.findMany({
    include: { employee: true },
  });

  const counter = new Map<string, { from_domain: string; to_role: string; scores: number[]; count: number }>();
  for (const sug of suggestions) {
    if (!sug.employee) continue;
    const key = `${sug.employee.primaryDomain}|${sug.suggestedRole}`;
    if (!counter.has(key)) {
      counter.set(key, {
        from_domain: sug.employee.primaryDomain,
        to_role: sug.suggestedRole,
        scores: [],
        count: 0,
      });
    }
    const entry = counter.get(key)!;
    entry.scores.push(sug.matchScore);
    entry.count += 1;
  }

  let topTransitions = [...counter.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((e) => ({
      from_domain: e.from_domain,
      to_role: e.to_role,
      success_pct: Math.round((e.scores.reduce((a, b) => a + b, 0) / e.scores.length) * 10) / 10,
      count: e.count,
    }));

  if (topTransitions.length === 0) {
    topTransitions = [
      { from_domain: "Backend Engineering", to_role: "Technical Architect", success_pct: 87.5, count: 3 },
      { from_domain: "Sales", to_role: "Customer Success Manager", success_pct: 82.0, count: 2 },
      { from_domain: "Project Management", to_role: "Technical Program Manager", success_pct: 78.5, count: 2 },
      { from_domain: "Data Science", to_role: "Data Engineering Lead", success_pct: 85.0, count: 1 },
      { from_domain: "Marketing", to_role: "Growth Marketing Strategist", success_pct: 80.0, count: 1 },
    ];
  }

  const catDist = getFailureCategoryDistribution(allEvents);

  const len = scores.length || 1;
  const avgRes = scores.reduce((a, s) => a + s.resilience, 0) / len;
  const avgFs = scores.reduce((a, s) => a + s.failure_score, 0) / len;
  const avgLs = scores.reduce((a, s) => a + s.leadership, 0) / len;

  return NextResponse.json({
    misalignment: { high, moderate, low, total_employees: employees.length },
    top_transitions: topTransitions,
    avg_resilience: Math.round(avgRes * 10) / 10,
    avg_failure_score: Math.round(avgFs * 10) / 10,
    avg_leadership: Math.round(avgLs * 10) / 10,
    failure_category_distribution: catDist,
  });
}
