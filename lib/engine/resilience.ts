import type { FailureEventInput } from "./types";

export function computeResilienceIndex(
  events: FailureEventInput[],
  softSkillScore = 5.0,
): number {
  if (!events.length) return 50.0;

  const n = events.length;

  // 1. Recovery speed score (0-25)
  const recoveryTimes = events.map((e) => e.recoveryTimeDays ?? 30);
  const avgRecovery = recoveryTimes.reduce((a, b) => a + b, 0) / n;
  const recoveryScore = Math.max(0, 25 * (1 - (avgRecovery - 7) / 53));

  // 2. Outcome improvement rate (0-30)
  const improved = events.filter((e) => e.outcomeAfter === "improved").length;
  const outcomeScore = (improved / n) * 30;

  // 3. Severity tolerance (0-25)
  const avgSeverity = events.reduce((a, e) => a + (e.severity ?? 5), 0) / n;
  const severityScore = (avgSeverity / 10) * 25;

  // 4. Soft-skill buffer (0-20)
  const softScore = (softSkillScore / 10) * 20;

  const total = recoveryScore + outcomeScore + severityScore + softScore;
  return Math.round(Math.min(Math.max(total, 0), 100) * 10) / 10;
}

export function computeEmotionalRecoveryScore(
  events: FailureEventInput[],
): number {
  if (!events.length) return 5.0;

  const scores: number[] = [];
  for (const evt of events) {
    const severity = evt.severity ?? 5.0;
    const recoveryDays = evt.recoveryTimeDays ?? 30;
    const outcome = evt.outcomeAfter ?? "neutral";

    const decayRate = 1.0 / Math.max(recoveryDays, 1);
    const remainingImpact = severity * Math.exp(-decayRate * 30);
    const outcomeBonus =
      outcome === "improved" ? 2 : outcome === "declined" ? -1 : 0;

    const eventScore = 10 - remainingImpact + outcomeBonus;
    scores.push(Math.max(0, Math.min(10, eventScore)));
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}
