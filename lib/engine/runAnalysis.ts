import { prisma } from "../db";
import {
  computeFailureScore,
  computeGrowthTrajectory,
  computeTransformationalLearningScore,
} from "./failureAnalyzer";
import { computeResilienceIndex, computeEmotionalRecoveryScore } from "./resilience";
import { computeLeadershipScore } from "./leadership";
import { matchRoles } from "./roleMatcher";
import { generateExplanationText, generateFeatureImportance } from "./explainability";
import type { FailureEventInput, StrengthInput } from "./types";

const DL_SERVICE_URL = process.env.DL_SERVICE_URL ?? "http://localhost:8000";

/**
 * Call the Python DL microservice for model-based scoring.
 * Returns null on any error (network down, timeout, etc.) so the caller
 * can fall back to JS heuristics gracefully.
 */
async function callDlService(payload: {
  hours_worked: number;
  hours_per_cycle: number;
  defects: number;
  defect_fix_hours: number;
  productivity_cycles: number;
  on_time: boolean;
  soft_skill_score: number;
  years_experience: number;
  js_resilience: number;
  js_failure_score: number;
  js_leadership_score: number;
  failure_events: { category: string; severity: number; recovery_time_days: number; outcome_after: string; days_ago: number }[];
  strengths: { name: string; score: number }[];
  lifecycle?: string;
}): Promise<{
  resilience_index: number;
  failure_score: number;
  growth_trajectory: string;
  top_roles: { role: string; match_score: number; rank: number }[];
} | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000); // 5s timeout
    const res = await fetch(`${DL_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // service down — use JS fallback
  }
}

/**
 * Translate raw performance records into FailureEvent inputs the engine
 * understands. Heuristics:
 *   - High defects relative to hours worked  → quality_issue
 *   - Significant fix-time per defect (>5h)  → process_failure
 *   - On-time submission false               → deadline_miss
 */
function recordsToFailureInputs(
  records: { hoursWorked: number; defects: number; defectFixHours: number; onTimeSubmission: boolean; cycleEnd: Date }[],
): FailureEventInput[] {
  const events: FailureEventInput[] = [];
  for (const r of records) {
    const tat = r.defects > 0 ? r.defectFixHours / r.defects : 0;

    if (r.defects > 0) {
      const sev = Math.max(3, Math.min(10, 4 + Math.log2(1 + r.defects) * 1.2));
      events.push({
        category: "quality_issue",
        description: `${r.defects} defects in cycle`,
        severity: Math.round(sev * 10) / 10,
        date: r.cycleEnd,
        recoveryTimeDays: Math.round(Math.max(3, Math.min(60, r.defectFixHours / 8))),
        outcomeAfter: r.defects <= 3 ? "improved" : r.defects <= 8 ? "neutral" : "declined",
      });
    }

    if (tat > 5) {
      events.push({
        category: "process_failure",
        description: `Avg defect TAT ${tat.toFixed(1)}h`,
        severity: Math.min(10, 4 + tat / 5),
        date: r.cycleEnd,
        recoveryTimeDays: 14,
        outcomeAfter: tat < 8 ? "improved" : "neutral",
      });
    }

    if (!r.onTimeSubmission) {
      events.push({
        category: "deadline_miss",
        description: "Cycle submission was late",
        severity: 6,
        date: r.cycleEnd,
        recoveryTimeDays: 10,
        outcomeAfter: "neutral",
      });
    }
  }
  return events;
}

interface AnalysisOptions {
  cycleStart: Date;
  cycleEnd: Date;
}

/**
 * Run the full Failure Intelligence Mapper for a single user, persisting:
 *   - Derived FailureEvent rows for this cycle
 *   - A RoleSuggestion (top match) for this cycle
 *
 * Scoring priority:
 *   1. Python DL service (if reachable) — model-based scores (70% weight)
 *   2. JS heuristic engine — always runs as baseline/fallback (30% weight)
 */
export async function runAnalysisForUser(userId: number, opts: AnalysisOptions) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { strengths: true },
  });
  if (!user) return null;

  // ── Fetch org's active role catalog ────────────────────────────────────────
  let allowedRoles: string[] | undefined;
  let roleCategories: Map<string, string> | undefined;

  if (user.orgId) {
    const orgRoles = await prisma.orgRole.findMany({
      where: { orgId: user.orgId, active: true },
      select: { title: true, category: true },
    });
    if (orgRoles.length > 0) {
      allowedRoles   = orgRoles.map((r) => r.title);
      roleCategories = new Map(orgRoles.map((r) => [r.title, r.category]));
    }
  }
  // If org has no roles configured yet, allowedRoles stays undefined and
  // matchRoles falls back to the built-in ROLE_DEFINITIONS.

  const records = await prisma.performanceRecord.findMany({
    where: {
      userId,
      cycleStart: { lte: opts.cycleEnd },
      cycleEnd: { gte: opts.cycleStart },
    },
  });

  const derived = recordsToFailureInputs(records);

  const historicalEvents = await prisma.failureEvent.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 50,
  });

  const allEvents: FailureEventInput[] = [
    ...derived,
    ...historicalEvents.map((e) => ({
      category: e.category,
      description: e.description,
      severity: e.severity,
      date: e.date,
      recoveryTimeDays: e.recoveryTimeDays,
      outcomeAfter: e.outcomeAfter,
    })),
  ];

  const strengthInputs: StrengthInput[] = user.strengths.map((s) => ({
    name: s.name,
    score: s.score,
    source: s.source,
  }));

  // ── JS heuristic baseline ──────────────────────────────────────────────────
  const jsFailureScore    = computeFailureScore(allEvents);
  const jsResilienceIndex = computeResilienceIndex(allEvents, user.softSkillScore);
  const jsLeadershipScore = computeLeadershipScore(allEvents, strengthInputs, user.softSkillScore);
  const emotionalRecovery = computeEmotionalRecoveryScore(allEvents);
  const jsGrowthTrajectory = computeGrowthTrajectory(allEvents);
  const transformationalLearning = computeTransformationalLearningScore(allEvents);
  const jsMatches = matchRoles(strengthInputs, allEvents, user.softSkillScore, jsResilienceIndex, 1, allowedRoles, roleCategories);

  // ── DL service (blended scoring) ──────────────────────────────────────────
  let failureScore    = jsFailureScore;
  let resilienceIndex = jsResilienceIndex;
  let growthTrajectory: string = jsGrowthTrajectory;
  let topRoleName   = jsMatches[0]?.role    ?? "Technical Architect";
  let topMatchScore = jsMatches[0]?.match_score ?? 0;

  const latestRecord = records.at(-1);
  if (latestRecord) {
    const nowMs = Date.now();
    const dlResult = await callDlService({
      hours_worked:      latestRecord.hoursWorked,
      hours_per_cycle:   latestRecord.hoursPerCycle,
      defects:           latestRecord.defects,
      defect_fix_hours:  latestRecord.defectFixHours,
      productivity_cycles: latestRecord.productivityCycles,
      on_time:           latestRecord.onTimeSubmission,
      soft_skill_score:  user.softSkillScore,
      years_experience:  user.yearsExperience,
      js_resilience:     jsResilienceIndex,
      js_failure_score:  jsFailureScore,
      js_leadership_score: jsLeadershipScore,
      failure_events: allEvents.slice(0, 20).map((e) => ({
        category:          e.category,
        severity:          e.severity ?? 5,
        recovery_time_days: e.recoveryTimeDays ?? 30,
        outcome_after:     String(e.outcomeAfter ?? "neutral"),
        days_ago: e.date ? (nowMs - new Date(e.date).getTime()) / 86_400_000 : 0,
      })),
      strengths: strengthInputs.map((s) => ({ name: s.name, score: s.score })),
    });

    if (dlResult) {
      // Blend: DL scores take priority (70% DL + 30% JS)
      resilienceIndex  = Math.round((dlResult.resilience_index * 0.7 + jsResilienceIndex * 0.3) * 10) / 10;
      failureScore     = Math.round((dlResult.failure_score    * 0.7 + jsFailureScore    * 0.3) * 10) / 10;
      growthTrajectory = dlResult.growth_trajectory;

      // Filter DL top_roles to only those in the org's allowed catalog
      const allowedSet = allowedRoles ? new Set(allowedRoles) : null;
      const filteredDlRoles = dlResult.top_roles.filter(
        (r) => !allowedSet || allowedSet.has(r.role),
      );

      if (filteredDlRoles.length > 0) {
        topRoleName   = filteredDlRoles[0].role;
        topMatchScore = filteredDlRoles[0].match_score;
      } else if (jsMatches.length > 0) {
        // DL suggested nothing in the org catalog — fall back to JS result
        topRoleName   = jsMatches[0].role;
        topMatchScore = jsMatches[0].match_score;
      }
    }
  }

  const featureImportance = generateFeatureImportance(
    allEvents,
    strengthInputs,
    resilienceIndex,
    user.softSkillScore,
    jsLeadershipScore,
  );

  const explanation = generateExplanationText(
    user.name,
    topRoleName,
    topMatchScore,
    allEvents,
    strengthInputs,
    resilienceIndex,
    jsLeadershipScore,
  );

  const suggestion = await prisma.$transaction(async (tx) => {
    if (derived.length) {
      await tx.failureEvent.createMany({
        data: derived.map((e) => ({
          userId,
          category:          e.category,
          description:       e.description ?? null,
          severity:          e.severity,
          date:              e.date as Date,
          recoveryTimeDays:  e.recoveryTimeDays,
          outcomeAfter:      String(e.outcomeAfter),
        })),
      });
    }
    return tx.roleSuggestion.create({
      data: {
        userId,
        cycleStart:     opts.cycleStart,
        cycleEnd:       opts.cycleEnd,
        suggestedRole:  topRoleName,
        matchScore:     topMatchScore,
        failureScore,
        resilienceIndex,
        leadershipScore: jsLeadershipScore,
        growthTrajectory,
        explanation,
        featureImportance: JSON.stringify(featureImportance),
      },
    });
  });

  return {
    suggestion,
    failureScore,
    resilienceIndex,
    leadershipScore: jsLeadershipScore,
    emotionalRecovery,
    transformationalLearning,
    growthTrajectory,
    matches: jsMatches,
    featureImportance,
    explanation,
  };
}
