import type { FailureEventInput, StrengthInput } from "./types";

/**
 * Canonical skill-vector definitions for well-known roles.
 * Used when the org's role catalog contains these titles — gives the engine
 * the highest-fidelity match because every dimension is hand-tuned.
 */
export const ROLE_DEFINITIONS: Record<string, Record<string, number>> = {
  "Technical Architect": {
    problem_solving: 9, system_thinking: 9, deep_technical_knowledge: 8,
    architecture_design: 9, communication: 6, creativity: 5,
    leadership: 5, empathy: 4, crisis_management: 6,
  },
  "Software Architect": {
    problem_solving: 9, system_thinking: 8, deep_technical_knowledge: 9,
    architecture_design: 9, attention_to_detail: 8, communication: 6,
    process_improvement: 6, creativity: 5,
  },
  "Solution Architect": {
    problem_solving: 8, system_thinking: 8, deep_technical_knowledge: 7,
    architecture_design: 8, stakeholder_management: 8, communication: 8,
    strategic_vision: 7, adaptability: 7,
  },
  "Enterprise Architect": {
    strategic_vision: 9, system_thinking: 9, deep_technical_knowledge: 7,
    architecture_design: 8, stakeholder_management: 9, communication: 8,
    leadership: 7, process_improvement: 7,
  },
  "Engineering Manager": {
    problem_solving: 7, communication: 8, leadership: 9,
    empathy: 8, team_conflict_resolution: 9, strategic_vision: 7,
    stakeholder_management: 8, adaptability: 7, crisis_management: 6,
  },
  "Director of Engineering": {
    leadership: 9, strategic_vision: 9, stakeholder_management: 9,
    communication: 8, empathy: 7, cross_functional_leadership: 9,
    team_conflict_resolution: 8, adaptability: 7,
  },
  "VP of Engineering": {
    leadership: 9, strategic_vision: 9, stakeholder_management: 9,
    cross_functional_leadership: 9, communication: 8, empathy: 7,
    visionary_thinking: 8, risk_assessment: 8,
  },
  "CTO": {
    leadership: 9, strategic_vision: 9, visionary_thinking: 9,
    stakeholder_management: 9, deep_technical_knowledge: 7, communication: 9,
    risk_assessment: 8, adaptability: 8,
  },
  "Team Lead": {
    leadership: 7, communication: 8, empathy: 7, problem_solving: 7,
    team_conflict_resolution: 7, deep_technical_knowledge: 7,
    process_improvement: 6, adaptability: 7,
  },
  "Scrum Master": {
    process_improvement: 9, communication: 9, empathy: 8,
    team_conflict_resolution: 8, adaptability: 8, leadership: 7,
    problem_solving: 6, active_listening: 8,
  },
  "Agile Coach": {
    process_improvement: 9, communication: 9, empathy: 9,
    adaptability: 9, leadership: 7, team_conflict_resolution: 8,
    visionary_thinking: 7, active_listening: 9,
  },
  "Technical Program Manager": {
    strategic_vision: 8, stakeholder_management: 9, risk_assessment: 8,
    communication: 8, leadership: 7, process_improvement: 7,
    cross_functional_leadership: 8, adaptability: 7, empathy: 6,
  },
  "Project Manager": {
    stakeholder_management: 8, risk_assessment: 8, communication: 8,
    process_improvement: 7, leadership: 7, adaptability: 7,
    attention_to_detail: 7, problem_solving: 6, team_conflict_resolution: 7,
  },
  "Delivery Manager": {
    stakeholder_management: 8, communication: 8, leadership: 7,
    risk_assessment: 7, process_improvement: 8, adaptability: 8,
    cross_functional_leadership: 7, team_conflict_resolution: 7,
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
  "Product Manager": {
    strategic_vision: 8, stakeholder_management: 8, communication: 8,
    empathy: 8, analytical_thinking: 7, creativity: 7,
    adaptability: 7, cross_functional_leadership: 7, problem_solving: 7,
  },
  "Product Owner": {
    stakeholder_management: 8, communication: 8, analytical_thinking: 7,
    empathy: 7, adaptability: 7, process_improvement: 7,
    problem_solving: 7, attention_to_detail: 7,
  },
  "UX Research Lead": {
    user_empathy: 9, creativity: 8, analytical_thinking: 7,
    communication: 8, storytelling_with_data: 8, visual_communication: 7,
    adaptability: 7, empathy: 8, attention_to_detail: 7,
  },
  "UX Designer": {
    user_empathy: 9, creativity: 8, visual_communication: 8,
    communication: 7, attention_to_detail: 7, analytical_thinking: 6,
    empathy: 8, adaptability: 7,
  },
  "UI Designer": {
    creativity: 9, visual_communication: 9, attention_to_detail: 8,
    user_empathy: 7, communication: 6, adaptability: 7,
  },
  "UX Researcher": {
    user_empathy: 9, analytical_thinking: 8, communication: 8,
    storytelling_with_data: 7, empathy: 8, attention_to_detail: 7,
    adaptability: 7,
  },
  "Design Lead": {
    creativity: 9, visual_communication: 9, leadership: 7,
    user_empathy: 8, communication: 7, attention_to_detail: 8,
    strategic_vision: 6,
  },
  "Interaction Designer": {
    creativity: 8, user_empathy: 8, visual_communication: 8,
    attention_to_detail: 8, communication: 7, analytical_thinking: 6,
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
  "DevOps Engineer": {
    automation_mindset: 9, crisis_management: 8, system_thinking: 8,
    deep_technical_knowledge: 8, quick_recovery: 8, process_improvement: 7,
    problem_solving: 7, attention_to_detail: 7,
  },
  "Site Reliability Engineer": {
    crisis_management: 9, automation_mindset: 8, deep_technical_knowledge: 8,
    quick_recovery: 9, system_thinking: 8, attention_to_detail: 8,
    process_improvement: 7, problem_solving: 8, communication: 5,
  },
  "Cloud Architect": {
    system_thinking: 9, deep_technical_knowledge: 9, automation_mindset: 8,
    crisis_management: 7, architecture_design: 8, strategic_vision: 7,
    process_improvement: 7,
  },
  "Growth Marketing Strategist": {
    creativity: 9, trend_analysis: 9, persuasion: 8,
    analytical_thinking: 7, storytelling_with_data: 8, communication: 8,
    adaptability: 7, strategic_vision: 6, empathy: 5,
  },
  "Data Analyst": {
    analytical_thinking: 9, attention_to_detail: 9, storytelling_with_data: 8,
    problem_solving: 7, communication: 7, deep_technical_knowledge: 6,
    process_improvement: 6,
  },
  "Data Scientist": {
    analytical_thinking: 9, deep_technical_knowledge: 8, problem_solving: 8,
    attention_to_detail: 8, storytelling_with_data: 7, system_thinking: 7,
    creativity: 6,
  },
  "Data Engineer": {
    analytical_thinking: 8, deep_technical_knowledge: 8, system_thinking: 8,
    automation_mindset: 8, attention_to_detail: 8, process_improvement: 7,
    problem_solving: 7,
  },
  "Machine Learning Engineer": {
    analytical_thinking: 9, deep_technical_knowledge: 9, problem_solving: 8,
    system_thinking: 7, automation_mindset: 7, attention_to_detail: 8,
    creativity: 7,
  },
  "Business Intelligence Analyst": {
    analytical_thinking: 9, storytelling_with_data: 9, attention_to_detail: 8,
    communication: 7, process_improvement: 7, strategic_vision: 6,
    trend_analysis: 8,
  },
  "Sales Manager": {
    persuasion: 9, relationship_building: 9, leadership: 8,
    communication: 9, strategic_vision: 7, adaptability: 8,
    team_conflict_resolution: 6, trend_analysis: 7,
  },
  "Business Development Manager": {
    persuasion: 9, relationship_building: 9, strategic_vision: 8,
    communication: 9, trend_analysis: 8, adaptability: 8,
    analytical_thinking: 6,
  },
  "Sales Engineer": {
    deep_technical_knowledge: 8, persuasion: 7, communication: 9,
    problem_solving: 8, relationship_building: 7, adaptability: 7,
    analytical_thinking: 7,
  },
  "HR Manager": {
    empathy: 9, communication: 9, relationship_building: 8,
    active_listening: 8, process_improvement: 7, adaptability: 7,
    team_conflict_resolution: 8, leadership: 7,
  },
  "Recruiter": {
    relationship_building: 9, communication: 8, persuasion: 7,
    active_listening: 8, empathy: 7, adaptability: 7, trend_analysis: 6,
  },
  "Business Analyst": {
    analytical_thinking: 9, communication: 8, process_improvement: 8,
    attention_to_detail: 8, problem_solving: 8, stakeholder_management: 7,
    storytelling_with_data: 7,
  },
};

/**
 * Category-level fallback vectors — used when a role title is in the org
 * catalog but does NOT have a hand-tuned entry in ROLE_DEFINITIONS above.
 * Values are moderate (5–8) so they produce reasonable but not overly dominant
 * match scores.
 */
export const CATEGORY_VECTORS: Record<string, Record<string, number>> = {
  "Engineering": {
    problem_solving: 8, deep_technical_knowledge: 9, attention_to_detail: 7,
    system_thinking: 7, automation_mindset: 6, communication: 5,
  },
  "Testing & QA": {
    attention_to_detail: 9, analytical_thinking: 8, problem_solving: 7,
    process_improvement: 7, deep_technical_knowledge: 6, communication: 6,
  },
  "Data & Analytics": {
    analytical_thinking: 9, deep_technical_knowledge: 8, problem_solving: 8,
    attention_to_detail: 8, storytelling_with_data: 7, system_thinking: 7,
  },
  "DevOps & Infrastructure": {
    automation_mindset: 9, crisis_management: 8, system_thinking: 8,
    deep_technical_knowledge: 8, quick_recovery: 8, attention_to_detail: 7,
  },
  "Product & Design": {
    empathy: 8, creativity: 8, communication: 8, analytical_thinking: 7,
    strategic_vision: 7, user_empathy: 8, storytelling_with_data: 6,
  },
  "Architecture": {
    problem_solving: 9, system_thinking: 9, deep_technical_knowledge: 9,
    architecture_design: 9, strategic_vision: 7, communication: 7,
  },
  "Management": {
    leadership: 9, communication: 9, empathy: 8, strategic_vision: 8,
    stakeholder_management: 8, team_conflict_resolution: 8, adaptability: 7,
  },
  "HR": {
    empathy: 9, communication: 9, relationship_building: 8,
    active_listening: 8, adaptability: 7, persuasion: 6, analytical_thinking: 5,
  },
  "Marketing": {
    creativity: 9, communication: 8, analytical_thinking: 7,
    persuasion: 8, trend_analysis: 8, storytelling_with_data: 7, adaptability: 7,
  },
  "Sales": {
    persuasion: 9, relationship_building: 9, communication: 9,
    empathy: 7, adaptability: 8, trend_analysis: 6, active_listening: 8,
  },
  "Admin & Operations": {
    process_improvement: 8, attention_to_detail: 8, communication: 7,
    adaptability: 7, analytical_thinking: 7, problem_solving: 6,
  },
  "Finance": {
    analytical_thinking: 9, attention_to_detail: 9, process_improvement: 7,
    risk_assessment: 8, communication: 6, problem_solving: 7,
  },
  "Support": {
    empathy: 8, communication: 8, problem_solving: 7,
    active_listening: 8, adaptability: 7, deep_technical_knowledge: 6,
    crisis_management: 6,
  },
};

const normalizeKey = (name: string) =>
  name.toLowerCase().replace(/[\s\-\/()]/g, "_").replace(/_+/g, "_");

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
      vec.quick_recovery    = (vec.quick_recovery    ?? 0) + 2;
    }
  }

  if (vec.communication === undefined) vec.communication = softSkillScore * 0.8;
  if (vec.empathy        === undefined) vec.empathy       = softSkillScore * 0.7;
  if (vec.adaptability   === undefined) vec.adaptability  = softSkillScore * 0.6;

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

/**
 * Match an employee profile against roles.
 *
 * @param strengths       Employee strength inputs
 * @param events          Failure event inputs
 * @param softSkillScore  Holistic soft-skill score (0–10)
 * @param resilienceIndex Resilience index (0–100)
 * @param topN            How many top matches to return
 * @param allowedRoles    When provided, ONLY match against these role titles.
 *                        Each title is looked up in ROLE_DEFINITIONS first;
 *                        if not found, its category vector from CATEGORY_VECTORS
 *                        is used as a fallback.
 *                        When omitted, matches against all ROLE_DEFINITIONS.
 * @param roleCategories  Map of title → category (needed for fallback lookup).
 *                        Usually provided alongside allowedRoles.
 */
export function matchRoles(
  strengths: StrengthInput[],
  events: FailureEventInput[],
  softSkillScore: number,
  resilienceIndex: number,
  topN = 3,
  allowedRoles?: string[],
  roleCategories?: Map<string, string>,
): RoleMatch[] {
  const empVec = buildEmployeeVector(strengths, softSkillScore, events);

  // Build the candidate map: title → skill-vector
  const candidates: Array<{ title: string; vec: Record<string, number> }> = [];

  if (allowedRoles && allowedRoles.length > 0) {
    for (const title of allowedRoles) {
      if (ROLE_DEFINITIONS[title]) {
        candidates.push({ title, vec: ROLE_DEFINITIONS[title] });
      } else {
        // Fallback to category vector
        const cat = roleCategories?.get(title);
        const catVec = cat ? CATEGORY_VECTORS[cat] : null;
        if (catVec) {
          candidates.push({ title, vec: catVec });
        }
        // If we can't determine a vector at all, skip this role
      }
    }
  } else {
    // Backward-compat: use the built-in ROLE_DEFINITIONS
    for (const [title, vec] of Object.entries(ROLE_DEFINITIONS)) {
      candidates.push({ title, vec });
    }
  }

  const results: RoleMatch[] = [];
  for (const { title, vec } of candidates) {
    const sim = cosineSimilarity(empVec, vec);

    let bonus = 0;
    if ((vec.crisis_management ?? 0) >= 7 && resilienceIndex > 60) bonus = 5;
    if ((vec.leadership        ?? 0) >= 7 && resilienceIndex > 70) bonus += 3;

    let matchScore = Math.round((sim * 100 + bonus) * 10) / 10;
    matchScore = Math.min(matchScore, 99.5);

    const matchingAttrs: string[] = [];
    for (const k of Object.keys(vec)) {
      if (k in empVec && empVec[k] >= vec[k] * 0.7) {
        matchingAttrs.push(titleCase(k));
      }
    }

    const resilienceLabel =
      resilienceIndex > 70 ? "excellent" :
      resilienceIndex > 40 ? "moderate"  : "developing";

    const explanation =
      `Strong alignment based on: ${matchingAttrs.slice(0, 5).join(", ")}. ` +
      `Resilience index (${resilienceIndex}) indicates ${resilienceLabel} ` +
      `ability to handle role challenges.`;

    results.push({ role: title, match_score: matchScore, explanation });
  }

  results.sort((a, b) => b.match_score - a.match_score);
  return results.slice(0, topN);
}
