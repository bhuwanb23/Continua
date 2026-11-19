import type { ClaimClassification } from "@/lib/claims/types";

export const CLASSIFICATION_LABEL: Record<ClaimClassification, string> = {
  MEASURED: "MEASURED",
  MODELED: "MODELED",
  SCENARIO_ASSUMPTION: "ASSUMPTION",
  EXTERNAL_RESEARCH: "EXTERNAL",
  FUTURE_TARGET: "TARGET",
};

export const CLASSIFICATION_DESCRIPTION: Record<ClaimClassification, string> = {
  MEASURED: "Actual Continua benchmark/system result.",
  MODELED: "Calculated consequence under explicit assumptions.",
  SCENARIO_ASSUMPTION: "Input chosen for the demo/business model.",
  EXTERNAL_RESEARCH: "Third-party industry evidence.",
  FUTURE_TARGET: "Something not yet achieved.",
};

export function isMeasured(c: { classification: ClaimClassification }): boolean {
  return c.classification === "MEASURED";
}
export function isModeled(c: { classification: ClaimClassification }): boolean {
  return c.classification === "MODELED";
}
