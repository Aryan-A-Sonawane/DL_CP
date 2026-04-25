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
 */
export async function runAnalysisForUser(userId: number, opts: AnalysisOptions) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { strengths: true },
  });
  if (!user) return null;

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

  const failureScore = computeFailureScore(allEvents);
  const resilienceIndex = computeResilienceIndex(allEvents, user.softSkillScore);
  const leadershipScore = computeLeadershipScore(allEvents, strengthInputs, user.softSkillScore);
  const emotionalRecovery = computeEmotionalRecoveryScore(allEvents);
  const growthTrajectory = computeGrowthTrajectory(allEvents);
  const transformationalLearning = computeTransformationalLearningScore(allEvents);

  const matches = matchRoles(strengthInputs, allEvents, user.softSkillScore, resilienceIndex, 1);
  const top = matches[0];
  if (!top) return null;

  const featureImportance = generateFeatureImportance(
    allEvents,
    strengthInputs,
    resilienceIndex,
    user.softSkillScore,
    leadershipScore,
  );

  const explanation = generateExplanationText(
    user.name,
    top.role,
    top.match_score,
    allEvents,
    strengthInputs,
    resilienceIndex,
    leadershipScore,
  );

  const suggestion = await prisma.$transaction(async (tx) => {
    if (derived.length) {
      await tx.failureEvent.createMany({
        data: derived.map((e) => ({
          userId,
          category: e.category,
          description: e.description ?? null,
          severity: e.severity,
          date: e.date as Date,
          recoveryTimeDays: e.recoveryTimeDays,
          outcomeAfter: String(e.outcomeAfter),
        })),
      });
    }
    return tx.roleSuggestion.create({
      data: {
        userId,
        cycleStart: opts.cycleStart,
        cycleEnd: opts.cycleEnd,
        suggestedRole: top.role,
        matchScore: top.match_score,
        failureScore,
        resilienceIndex,
        leadershipScore,
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
    leadershipScore,
    emotionalRecovery,
    transformationalLearning,
    growthTrajectory,
    matches,
    featureImportance,
    explanation,
  };
}
