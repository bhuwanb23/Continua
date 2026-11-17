export const CLAIM_CLASSES = [
  "MEASURED",
  "MODELED",
  "SCENARIO_ASSUMPTION",
  "EXTERNAL_RESEARCH",
] as const;

export type ClaimClass = (typeof CLAIM_CLASSES)[number];

export interface Claim<T> {
  value: T;
  claim_class: ClaimClass;
  source?: string | undefined;
  note?: string | undefined;
}
