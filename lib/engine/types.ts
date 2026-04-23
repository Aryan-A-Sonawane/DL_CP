export type Outcome = "improved" | "neutral" | "declined";

export interface FailureEventInput {
  category: string;
  description?: string | null;
  severity: number;
  date: Date | string;
  recoveryTimeDays: number;
  outcomeAfter: Outcome | string;
}

export interface StrengthInput {
  name: string;
  score: number;
  source: string;
}
