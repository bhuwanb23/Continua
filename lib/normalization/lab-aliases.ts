export const LAB_ALIASES = {
  cbc: ["cbc", "CBC", "Complete Blood Count", "CBC with differential", "CBC w/ diff"],
  a1c: ["a1c", "A1c", "HbA1c", "Hemoglobin A1c"],
  bmp: ["bmp", "BMP", "Basic Metabolic Panel"],
  inr: ["inr", "INR", "Prothrombin Time/INR"],
  tsh: ["tsh", "TSH", "Thyroid Stimulating Hormone"],
  lipid: ["lipid", "Lipid Panel", "Fasting Lipid Panel"],
} as const;

export type LabCode = keyof typeof LAB_ALIASES;
