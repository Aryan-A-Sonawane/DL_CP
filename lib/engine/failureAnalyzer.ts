import type { FailureEventInput } from "./types";

export const CATEGORY_WEIGHTS: Record<string, number> = {
  deadline_miss: 0.6,
  quality_issue: 0.8,
  communication: 0.4,
  team_conflict: 0.7,
  budget_overrun: 0.65,
  stakeholder_rejection: 0.5,
  system_outage: 0.85,
  process_failure: 0.55,
  model_accuracy: 0.7,
  campaign_failure: 0.6,
  data_misinterpretation: 0.65,
  target_miss: 0.7,
  client_loss: 0.75,
};

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function computeFailureScore(events: FailureEventInput[]): number {
  if (!events.length) return 0;
  let total = 0;
  for (const e of events) {
    const cat = CATEGORY_WEIGHTS[e.category] ?? 0.5;
    const sev = e.severity ?? 5.0;
    total += sev * cat * 1.0;
  }
  const maxPossible = events.length * 10.0 * 1.0;
  const raw = maxPossible > 0 ? (total / maxPossible) * 100 : 0;
  return Math.round(Math.min(raw, 100) * 10) / 10;
}

export function getRepeatedFailureArea(events: FailureEventInput[]): string {
  if (!events.length) return "None";
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  let topKey = "";
  let topCount = -1;
  for (const [k, v] of counts) {
    if (v > topCount) {
      topCount = v;
      topKey = k;
    }
  }
  return titleCase(topKey);
}

export function computeGrowthTrajectory(
  events: FailureEventInput[],
): "ascending" | "stable" | "descending" {
  if (!events.length) return "stable";
  const map: Record<string, number> = { improved: 1, neutral: 0, declined: -1 };
  const scores = events.map((e) => map[e.outcomeAfter ?? "neutral"] ?? 0);
  if (scores.length < 2) return "stable";
  const mid = Math.floor(scores.length / 2);
  const firstHalf =
    scores.slice(0, mid).reduce((a, b) => a + b, 0) / Math.max(mid, 1);
  const secondHalf =
    scores.slice(mid).reduce((a, b) => a + b, 0) /
    Math.max(scores.length - mid, 1);
  const diff = secondHalf - firstHalf;
  if (diff > 0.3) return "ascending";
  if (diff < -0.3) return "descending";
  return "stable";
}

export function getFailureCategoryDistribution(
  events: FailureEventInput[],
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const out: Record<string, number> = {};
  for (const [k, v] of sorted) out[titleCase(k)] = v;
  return out;
}

export function computeTransformationalLearningScore(
  events: FailureEventInput[],
): number {
  if (!events.length) return 5.0;
  const improved = events.filter((e) => e.outcomeAfter === "improved").length;
  const improvementRate = improved / events.length;

  const recovery = events.map((e) => e.recoveryTimeDays ?? 30);
  let speedImprovement = 0;
  if (recovery.length >= 2) {
    const half = Math.floor(recovery.length / 2);
    const firstAvg =
      recovery.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(half, 1);
    const secondAvg =
      recovery.slice(half).reduce((a, b) => a + b, 0) /
      Math.max(recovery.length - half, 1);
    speedImprovement = Math.max(0, (firstAvg - secondAvg) / Math.max(firstAvg, 1));
  }

  const score = improvementRate * 6 + speedImprovement * 4;
  return Math.round(Math.min(Math.max(score, 0), 10) * 10) / 10;
}
