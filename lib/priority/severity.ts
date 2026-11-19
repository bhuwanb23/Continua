import type { CandidateSeverity } from "@/lib/domain";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";

export function severityWeight(
  severity: CandidateSeverity,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): number {
  const weight = config.severity_weights[severity];
  if (typeof weight !== "number" || !Number.isFinite(weight)) {
    throw new Error(`Unsupported workflow severity: ${String(severity)}`);
  }
  return weight;
}
