export interface TimingResult {
  name: string;
  duration_ms: number;
  ok: boolean;
  budget_ms?: number;
}

export async function measure<T>(name: string, fn: () => Promise<T> | T, budget_ms?: number): Promise<{ result: T; timing: TimingResult }> {
  const start = performance.now();
  const result = await fn();
  const duration_ms = performance.now() - start;
  const timing: TimingResult = {
    name,
    duration_ms: Math.round(duration_ms * 100) / 100,
    ok: budget_ms === undefined ? true : duration_ms <= budget_ms,
  };
  if (budget_ms !== undefined) timing.budget_ms = budget_ms;
  return { result, timing };
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}
