export type ClaimClass = "MEASURED" | "MODELED" | "ASSUMED" | "NOT_CLAIMED";

export const claimLabel = (value: ClaimClass): string => value.replace("_", " ");
