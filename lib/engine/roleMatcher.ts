import type { FailureEventInput, StrengthInput } from "./types";

export const ROLE_DEFINITIONS: Record<string, Record<string, number>> = {
  "Technical Architect": {
    problem_solving: 9, system_thinking: 9, deep_technical_knowledge: 8,
    architecture_design: 9, communication: 6, creativity: 5,
    leadership: 5, empathy: 4, crisis_management: 6,
  },
  "Engineering Manager": {
    problem_solving: 7, communication: 8, leadership: 9,
    empathy: 8, team_conflict_resolution: 9, strategic_vision: 7,
    stakeholder_management: 8, adaptability: 7, crisis_management: 6,
  },
  "Data Engineering Lead": {
    analytical_thinking: 9, system_thinking: 8, automation_mindset: 8,
    problem_solving: 8, deep_technical_knowledge: 7, process_improvement: 7,
    communication: 6, attention_to_detail: 8, crisis_management: 5,
  },
  "Product Strategist": {
    strategic_vision: 9, visionary_thinking: 9, stakeholder_management: 8,
    communication: 8, empathy: 7, analytical_thinking: 7,
    creativity: 7, cross_functional_leadership: 8, adaptability: 7,
  },
  "UX Research Lead": {
    user_empathy: 9, creativity: 8, analytical_thinking: 7,
    communication: 8, storytelling_with_data: 8, visual_communication: 7,
    adaptability: 7, empathy: 8, attention_to_detail: 7,
  },
  "Customer Success Manager": {
    empathy: 9, relationship_building: 9, active_listening: 8,
    communication: 9, problem_solving: 6, persuasion: 7,
    adaptability: 8, crisis_management: 6, trend_analysis: 5,
  },
  "DevOps Architect": {
    automation_mindset: 9, crisis_management: 9, system_thinking: 8,
    deep_technical_knowledge: 8, quick_recovery: 8, process_improvement: 8,
    problem_solving: 8, attention_to_detail: 7, communication: 5,
  },
  "Technical Program Manager": {
    strategic_vision: 8, stakeholder_management: 9, risk_assessment: 8,
    communication: 8, leadership: 7, process_improvement: 7,
    cross_functional_leadership: 8, adaptability: 7, empathy: 6,
  },
  "Growth Marketing Strategist": {
    creativity: 9, trend_analysis: 9, persuasion: 8,
    analytical_thinking: 7, storytelling_with_data: 8, communication: 8,
    adaptability: 7, strategic_vision: 6, empathy: 5,
  },
  "Site Reliability Engineer": {
    crisis_management: 9, automation_mindset: 8, deep_technical_knowledge: 8,
    quick_recovery: 9, system_thinking: 8, attention_to_detail: 8,
    process_improvement: 7, problem_solving: 8, communication: 5,
  },
};

const normalizeKey = (name: string) =>
  name.toLowerCase().replace(/[\s-]/g, "_");

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function buildEmployeeVector(
  strengths: StrengthInput[],
  softSkillScore: number,
  events: FailureEventInput[],
): Record<string, number> {
  const vec: Record<string, number> = {};

  for (const s of strengths) {
    vec[normalizeKey(s.name)] = s.score;
  }

  for (const e of events) {
    if (e.category === "team_conflict" && e.outcomeAfter === "improved") {
      vec.team_conflict_resolution = (vec.team_conflict_resolution ?? 0) + 3;
    }
    if (e.category === "system_outage" && e.outcomeAfter === "improved") {
      vec.crisis_management = (vec.crisis_management ?? 0) + 3;
      vec.quick_recovery = (vec.quick_recovery ?? 0) + 2;
    }
  }

  if (vec.communication === undefined) vec.communication = softSkillScore * 0.8;
  if (vec.empathy === undefined) vec.empathy = softSkillScore * 0.7;
  if (vec.adaptability === undefined) vec.adaptability = softSkillScore * 0.6;

  for (const k of Object.keys(vec)) vec[k] = Math.min(vec[k], 10.0);
  return vec;
}

function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  for (const k of keys) dot += (a[k] ?? 0) * (b[k] ?? 0);
  const magA = Math.sqrt(Object.values(a).reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(Object.values(b).reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export interface RoleMatch {
  role: string;
  match_score: number;
  explanation: string;
}

export function matchRoles(
  strengths: StrengthInput[],
  events: FailureEventInput[],
  softSkillScore: number,
  resilienceIndex: number,
  topN = 3,
): RoleMatch[] {
  const empVec = buildEmployeeVector(strengths, softSkillScore, events);

  const results: RoleMatch[] = [];
  for (const [roleName, roleVec] of Object.entries(ROLE_DEFINITIONS)) {
    const sim = cosineSimilarity(empVec, roleVec);

    let bonus = 0;
    if ((roleVec.crisis_management ?? 0) >= 7 && resilienceIndex > 60) bonus = 5;
    if ((roleVec.leadership ?? 0) >= 7 && resilienceIndex > 70) bonus += 3;

    let matchScore = Math.round((sim * 100 + bonus) * 10) / 10;
    matchScore = Math.min(matchScore, 99.5);

    const matchingAttrs: string[] = [];
    for (const k of Object.keys(roleVec)) {
      if (k in empVec && empVec[k] >= roleVec[k] * 0.7) {
        matchingAttrs.push(titleCase(k));
      }
    }

    const resilienceLabel =
      resilienceIndex > 70 ? "excellent" :
      resilienceIndex > 40 ? "moderate" : "developing";

    const explanation =
      `Strong alignment based on: ${matchingAttrs.slice(0, 5).join(", ")}. ` +
      `Resilience index (${resilienceIndex}) indicates ${resilienceLabel} ` +
      `ability to handle role challenges.`;

    results.push({ role: roleName, match_score: matchScore, explanation });
  }

  results.sort((a, b) => b.match_score - a.match_score);
  return results.slice(0, topN);
}
