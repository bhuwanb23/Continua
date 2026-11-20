export interface PerformanceReport {
  version: string;
  generated_at: string;
  budgets: Record<string, number>;
  measurements: Record<string, number>;
  status: "PASS" | "FAIL";
  limitations: string[];
}

export function buildPerformanceReport(input: {
  version: string;
  measurements: Record<string, number>;
  budgets: Record<string, number>;
  limitations?: string[];
}): PerformanceReport {
  const status = Object.entries(input.budgets).every(([key, budget]) => {
    const measured = input.measurements[key];
    return measured === undefined || measured <= budget;
  })
    ? "PASS"
    : "FAIL";
  return {
    version: input.version,
    generated_at: new Date().toISOString(),
    budgets: input.budgets,
    measurements: input.measurements,
    status,
    limitations: input.limitations ?? [],
  };
}
