import type { FailureEventInput, StrengthInput } from "./types";

const normalizeKey = (name: string) =>
  name.toLowerCase().replace(/[\s-]/g, "_");

const LEADERSHIP_STRENGTHS = new Set([
  "strategic_vision", "visionary_thinking", "cross_functional_leadership",
  "stakeholder_management", "empathy", "leadership", "relationship_building",
  "persuasion", "active_listening",
]);

export function computeLeadershipScore(
  events: FailureEventInput[],
  strengths: StrengthInput[],
  softSkillScore: number,
): number {
  let score = 0;

  // 1. Conflict resolution from failures (0-25)
  const teamFailures = events.filter(
    (e) => e.category === "team_conflict" || e.category === "communication",
  );
  if (teamFailures.length) {
    const resolved = teamFailures.filter((e) => e.outcomeAfter === "improved").length;
    score += (resolved / teamFailures.length) * 25;
  }

  // 2. High-severity recovery (0-20)
  const highSev = events.filter((e) => (e.severity ?? 0) >= 7);
  if (highSev.length) {
    const recovered = highSev.filter((e) => e.outcomeAfter === "improved").length;
    score += (recovered / highSev.length) * 20;
  }

  // 3. Soft skill score (0-25)
  score += (softSkillScore / 10) * 25;

  // 4. Strategic strengths (0-30)
  for (const s of strengths) {
    const key = normalizeKey(s.name);
    if (LEADERSHIP_STRENGTHS.has(key)) {
      score += (s.score / 10) * (30 / Math.max(strengths.length, 1));
    }
  }

  return Math.round(Math.min(Math.max(score, 0), 100) * 10) / 10;
}

export function forecastLeadershipTrajectory(
  leadershipScore: number,
  growthTrajectory: string,
  yearsExperience: number,
) {
  const multiplier =
    growthTrajectory === "ascending" ? 1.15 :
    growthTrajectory === "descending" ? 0.85 : 1.0;

  const expFactor = Math.min(yearsExperience / 10, 1.0);

  const projected1y = leadershipScore * multiplier * (1 + expFactor * 0.1);
  const projected3y = leadershipScore * Math.pow(multiplier, 3) * (1 + expFactor * 0.25);

  let readiness = "Not Ready";
  if (projected1y >= 70) readiness = "Ready Now";
  else if (projected1y >= 50) readiness = "Ready in 1-2 Years";
  else if (projected3y >= 60) readiness = "Ready in 3-5 Years";

  return {
    current_score: leadershipScore,
    projected_1y: Math.round(Math.min(projected1y, 100) * 10) / 10,
    projected_3y: Math.round(Math.min(projected3y, 100) * 10) / 10,
    readiness,
    growth_trajectory: growthTrajectory,
  };
}
