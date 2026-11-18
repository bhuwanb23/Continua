/**
 * Frozen temporal arithmetic for the evaluator. Uses UTC calendar dates only;
 * no system clock, no locale parsing, and no timezone-dependent behavior.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parse(date: string): { year: number; month: number; day: number } {
  const match = ISO_DATE.exec(date);
  if (!match) throw new Error(`Invalid ISO date: ${date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new Error(`Invalid ISO date: ${date}`);
  return { year, month, day };
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  try {
    const { year, month, day } = parse(value);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    return (
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day
    );
  } catch {
    return false;
  }
}

export function addDays(date: string, days: number): string {
  if (!Number.isInteger(days)) throw new Error(`addDays requires an integer, got ${days}`);
  const { year, month, day } = parse(date);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const left = parse(from);
  const right = parse(to);
  const a = Date.UTC(left.year, left.month - 1, left.day);
  const b = Date.UTC(right.year, right.month - 1, right.day);
  return Math.round((b - a) / 86_400_000);
}

export function dueDate(triggerDate: string, windowDays: number): string {
  return addDays(triggerDate, windowDays);
}

/** Overdue is clamped at zero: a not-yet-due scenario is not a negative number. */
export function overdueDays(due: string, asOf: string): number {
  return Math.max(0, daysBetween(due, asOf));
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function dateCompatible(
  left: string,
  right: string,
  leftPrecision: "day" | "month" = "day",
  rightPrecision: "day" | "month" = "day",
): boolean {
  if (leftPrecision === "month" || rightPrecision === "month") {
    return monthKey(left) === monthKey(right);
  }
  return left === right;
}
