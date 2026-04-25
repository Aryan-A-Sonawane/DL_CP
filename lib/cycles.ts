export type CycleType = "monthly" | "bimonthly" | "quarterly" | "yearly";

export const CYCLE_DAYS: Record<CycleType, number> = {
  monthly: 30,
  bimonthly: 60,
  quarterly: 91,
  yearly: 365,
};

const REMINDER_OFFSETS = [10, 7, 5, 3, 2, 1, 0];

export interface CycleWindow {
  start: Date;
  end: Date;
  daysToGo: number;
  totalDays: number;
}

/**
 * Compute the active cycle window for a department based on its anchor date
 * and cycle length. Cycles repeat back-to-back from the anchor.
 */
export function activeCycleWindow(
  anchor: Date,
  cycleLengthDays: number,
  now = new Date(),
): CycleWindow {
  const len = Math.max(1, Math.floor(cycleLengthDays));
  const anchorMs = anchor.getTime();
  const nowMs = now.getTime();
  const dayMs = 86_400_000;
  const elapsedDays = Math.floor((nowMs - anchorMs) / dayMs);
  const cycleIndex = Math.floor(elapsedDays / len);
  const startMs = anchorMs + cycleIndex * len * dayMs;
  const start = new Date(startMs);
  const end = new Date(startMs + len * dayMs);
  const daysToGo = Math.ceil((end.getTime() - nowMs) / dayMs);
  return { start, end, daysToGo, totalDays: len };
}

export function shouldShowReminder(daysToGo: number): boolean {
  if (daysToGo < 0) return true; // overdue
  return REMINDER_OFFSETS.includes(daysToGo);
}

export function reminderTone(daysToGo: number): "info" | "warn" | "danger" {
  if (daysToGo <= 0) return "danger";
  if (daysToGo <= 3) return "danger";
  if (daysToGo <= 7) return "warn";
  return "info";
}

export function reminderMessage(daysToGo: number): string {
  if (daysToGo < 0) return `Cycle ended ${Math.abs(daysToGo)} day${Math.abs(daysToGo) === 1 ? "" : "s"} ago — please upload the report.`;
  if (daysToGo === 0) return "Cycle ends today — upload the report before midnight.";
  if (daysToGo === 1) return "1 day to go — upload the productivity report tomorrow.";
  return `${daysToGo} days to go — upload the productivity report by cycle end.`;
}
