export const SPECIALTY_ALIASES = {
  oncology: ["oncology", "Oncology", "Medical Oncology", "Med Onc", "Heme-Onc"],
  cardiology: ["cardiology", "Cardiology", "Cardiac Clinic", "Cardiovascular"],
  endocrinology: ["endocrinology", "Endocrinology", "Endocrine Clinic"],
  primary_care: ["primary_care", "Primary Care", "PCP", "Family Medicine"],
  surgery: ["surgery", "Surgery", "Surgical Oncology", "General Surgery"],
  imaging: ["imaging", "Imaging", "Radiology"],
  laboratory: ["laboratory", "Laboratory", "Lab"],
  pharmacy: ["pharmacy", "Pharmacy"],
} as const;

export type SpecialtyCode = keyof typeof SPECIALTY_ALIASES;
