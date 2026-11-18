import { BODY_REGION_ALIASES, IMAGING_MODALITY_ALIASES, type ImagingModalityCode } from "./imaging-aliases";
import { LAB_ALIASES, type LabCode } from "./lab-aliases";
import { MEDICATION_ALIASES, type MedicationCode } from "./medication-aliases";
import { SPECIALTY_ALIASES, type SpecialtyCode } from "./specialty-aliases";
import { NORMALIZATION_VERSION } from "./version";

function lookup<T extends string>(maps: Record<string, readonly string[]>, raw: string): T | null {
  const value = raw.trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(maps)) {
    if (aliases.some((alias) => alias.toLowerCase() === value)) return canonical as T;
  }
  return null;
}

export { NORMALIZATION_VERSION };
export * from "./imaging-aliases";
export * from "./lab-aliases";
export * from "./medication-aliases";
export * from "./provider-aliases";
export * from "./specialty-aliases";
export * from "./version";

export function normalizeLab(raw: string): LabCode | null {
  return lookup<LabCode>(LAB_ALIASES, raw);
}

export function normalizeMedication(raw: string): MedicationCode | null {
  const cleaned = raw.trim().replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|units?)?\b.*$/i, "").trim();
  return lookup<MedicationCode>(MEDICATION_ALIASES, cleaned);
}

export function normalizeSpecialty(raw: string): SpecialtyCode | null {
  return lookup<SpecialtyCode>(SPECIALTY_ALIASES, raw);
}

export function normalizeImagingModality(raw: string): ImagingModalityCode | null {
  return lookup<ImagingModalityCode>(IMAGING_MODALITY_ALIASES, raw);
}

export function normalizeBodyRegion(raw: string): string | null {
  const exact = lookup<string>(BODY_REGION_ALIASES, raw);
  if (exact) return exact;
  const lowered = raw.trim().toLowerCase();
  const containing = Object.entries(BODY_REGION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => lowered.includes(alias.toLowerCase())))
    .sort((left, right) => right[0].length - left[0].length)[0]?.[0];
  return containing ?? (lowered.length > 0 ? lowered : null);
}
