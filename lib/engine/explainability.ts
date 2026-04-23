import type { FailureEventInput, StrengthInput } from "./types";

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function generateFeatureImportance(
  events: FailureEventInput[],
  strengths: StrengthInput[],
  resilienceIndex: number,
  softSkillScore: number,
  leadershipScore: number,
): Record<string, number> {
  const raw: Record<string, number> = {};

  const totalStrength =
    strengths.length > 0 ? strengths.reduce((a, s) => a + s.score, 0) : 1;
  for (const s of strengths) {
    raw[`Strength: ${s.name}`] = (s.score / totalStrength) * 30;
  }

  if (events.length) {
    const improved = events.filter((e) => e.outcomeAfter === "improved").length;
    raw["Recovery Pattern"] = (improved / events.length) * 20;
    raw["Failure Frequency"] = Math.min(events.length * 3, 15);
  } else {
    raw["No Failure Data"] = 5;
  }

  raw["Resilience Index"] = (resilienceIndex / 100) * 15;
  raw["Soft Skills"] = (softSkillScore / 10) * 10;
  raw["Leadership Potential"] = (leadershipScore / 100) * 10;

  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const normalized: Record<string, number> = {};
  if (total > 0) {
    for (const [k, v] of Object.entries(raw)) {
      normalized[k] = Math.round((v / total) * 100 * 10) / 10;
    }
  }

  // sort descending
  return Object.fromEntries(
    Object.entries(normalized).sort((a, b) => b[1] - a[1]),
  );
}

export function generateExplanationText(
  employeeName: string,
  suggestedRole: string,
  matchScore: number,
  events: FailureEventInput[],
  strengths: StrengthInput[],
  resilienceIndex: number,
  leadershipScore: number,
): string {
  const topStrengths = [...strengths]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.name);

  const improvedFailures = events.filter((e) => e.outcomeAfter === "improved");

  const parts: string[] = [
    `Based on comprehensive analysis, ${employeeName} shows a ${matchScore}% alignment with the ${suggestedRole} role.`,
    "",
    `Key strengths driving this recommendation: ${topStrengths.join(", ")}.`,
  ];

  if (improvedFailures.length) {
    const categories = [
      ...new Set(improvedFailures.map((e) => titleCase(e.category))),
    ];
    parts.push(
      `Notably, ${employeeName} demonstrated strong recovery after setbacks in ${categories.slice(0, 3).join(", ")}, suggesting resilience and adaptability.`,
    );
  }

  if (resilienceIndex > 70) {
    parts.push(
      `With a resilience index of ${resilienceIndex}, this employee shows exceptional ability to handle challenges inherent in the ${suggestedRole} role.`,
    );
  } else if (resilienceIndex > 40) {
    parts.push(
      `A moderate resilience index of ${resilienceIndex} suggests steady ability to handle role transitions with appropriate support.`,
    );
  }

  if (leadershipScore > 60) {
    parts.push(
      `Leadership potential score of ${leadershipScore} indicates readiness for people-management components of this role.`,
    );
  }

  parts.push("");
  parts.push(
    "DISCLAIMER: This recommendation is AI-generated and should be used as one data point among many in career development discussions. No demographic data was used in this analysis. Final decisions should involve the employee, their manager, and HR professionals.",
  );

  return parts.join(" ");
}
