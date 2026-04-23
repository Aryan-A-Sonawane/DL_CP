export type RiskLevel = "Low" | "Medium" | "High";

export interface AuditDimension {
  dimension: string;
  score: number;
  risk_level: RiskLevel;
  notes: string;
}

const PASSIONIT_DIMENSIONS: [string, string][] = [
  ["Purpose", "Does the recommendation serve the employee's career growth and well-being?"],
  ["Accountability", "Are there clear owners and appeal processes for this recommendation?"],
  ["Safety", "Does the recommendation protect against harmful career disruption?"],
  ["Sustainability", "Is the suggested transition sustainable long-term for the employee?"],
  ["Inclusivity", "Was the analysis inclusive and accessible to all employee demographics?"],
  ["Objectivity", "Is the recommendation based on objective performance data?"],
  ["Non-bias", "Were demographic factors excluded from the matching algorithm?"],
  ["Integrity", "Does the recommendation maintain data integrity and honesty?"],
  ["Transparency", "Is the reasoning behind the recommendation fully explainable?"],
];

const PRUTL_DIMENSIONS: [string, string][] = [
  ["Privacy", "Is employee data properly anonymized and access-controlled?"],
  ["Reliability", "Is the algorithm consistent and reproducible across runs?"],
  ["Usability", "Can HR professionals easily understand and act on recommendations?"],
  ["Trustworthiness", "Does the system inspire confidence through accuracy and fairness?"],
  ["Legality", "Does the recommendation comply with employment law and regulations?"],
];

function riskLevel(score: number): RiskLevel {
  if (score >= 8.0) return "Low";
  if (score >= 5.0) return "Medium";
  return "High";
}

const jitter = () => (Math.random() - 0.5) * 0.6; // ~ -0.3..0.3

export function scorePassionit(
  matchScore: number,
  resilienceIndex: number,
  hasExplanation: boolean,
  failureCount: number,
): AuditDimension[] {
  const baseScores: Record<string, number> = {
    Purpose: Math.min(9.5, 7.0 + (matchScore / 100) * 3),
    Accountability: 8.5,
    Safety: Math.min(9.0, 6.5 + (resilienceIndex / 100) * 3),
    Sustainability: Math.min(9.0, 6.0 + (matchScore / 100) * 3),
    Inclusivity: 9.0,
    Objectivity: Math.min(9.5, 7.0 + Math.min(failureCount, 5) * 0.5),
    "Non-bias": 9.2,
    Integrity: hasExplanation ? 8.8 : 6.0,
    Transparency: hasExplanation ? 9.0 : 5.0,
  };

  return PASSIONIT_DIMENSIONS.map(([name, desc]) => {
    let score = Math.round(((baseScores[name] ?? 7.0) + jitter()) * 10) / 10;
    score = Math.min(Math.max(score, 1.0), 10.0);
    return {
      dimension: name,
      score,
      risk_level: riskLevel(score),
      notes: desc,
    };
  });
}

export function scorePrutl(
  matchScore: number,
  hasExplanation: boolean,
): AuditDimension[] {
  const baseScores: Record<string, number> = {
    Privacy: 9.0,
    Reliability: 8.5,
    Usability: hasExplanation ? 8.0 : 5.5,
    Trustworthiness: Math.min(9.0, 7.0 + (matchScore / 100) * 2),
    Legality: 9.0,
  };

  return PRUTL_DIMENSIONS.map(([name, desc]) => {
    let score = Math.round(((baseScores[name] ?? 7.0) + jitter()) * 10) / 10;
    score = Math.min(Math.max(score, 1.0), 10.0);
    return {
      dimension: name,
      score,
      risk_level: riskLevel(score),
      notes: desc,
    };
  });
}

export function computeOverallEthics(
  passionit: AuditDimension[],
  prutl: AuditDimension[],
): { overall_score: number; overall_risk: RiskLevel } {
  const all = [...passionit, ...prutl].map((d) => d.score);
  const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  const rounded = Math.round(avg * 10) / 10;
  return { overall_score: rounded, overall_risk: riskLevel(rounded) };
}
