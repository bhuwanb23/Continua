import type { ImpactResult } from "@/lib/impact/types";

export function formatHours(value: number): string {
  return value.toFixed(2);
}

export function formatMinutes(value: number): string {
  return value.toFixed(1);
}

export function describeImpact(result: ImpactResult): string {
  return `Modeled potential time redirected: ${formatHours(result.perMonthHours)} hours/month (${formatMinutes(result.perDayMinutes)} minutes/day).`;
}
