export const MEDICATION_ALIASES = {
  metformin: ["metformin", "metformin HCl", "Glucophage"],
  warfarin: ["warfarin", "Coumadin"],
  tamoxifen: ["tamoxifen", "Nolvadex"],
  lisinopril: ["lisinopril", "Zestril"],
  atorvastatin: ["atorvastatin", "Lipitor"],
} as const;

export type MedicationCode = keyof typeof MEDICATION_ALIASES;
