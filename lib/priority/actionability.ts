import type { GapType } from "@/lib/domain";
import type { PriorityConfig } from "./config";
import { DEFAULT_PRIORITY_CONFIG } from "./config";
import type { ActionabilityClass } from "./types";

export function actionabilityClassFor(gapType: GapType): ActionabilityClass {
  return gapType === "duplicate_test" ? "review_with_provider" : "direct_coordinator_action";
}

export function actionabilityWeight(
  gapType: GapType,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): number {
  const weight = config.actionability_weights[gapType];
  if (typeof weight !== "number" || !Number.isFinite(weight)) {
    throw new Error(`Unsupported gap type for actionability: ${String(gapType)}`);
  }
  return weight;
}
