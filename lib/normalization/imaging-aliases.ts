export const IMAGING_MODALITY_ALIASES = {
  ct: ["ct", "CT", "computed tomography"],
  mri: ["mri", "MRI", "magnetic resonance imaging"],
  xray: ["xray", "X-ray", "x-ray", "radiograph"],
  pet: ["pet", "PET", "positron emission tomography"],
  mammogram: ["mammogram", "mammography"],
  ultrasound: ["ultrasound", "sonogram"],
  other: ["other"],
} as const;

export type ImagingModalityCode = keyof typeof IMAGING_MODALITY_ALIASES;

export const BODY_REGION_ALIASES = {
  brain: ["brain", "head"],
  breast: ["breast"],
  knee: ["knee"],
  chest: ["chest", "thorax"],
  abdomen: ["abdomen", "abdominal"],
  pelvis: ["pelvis", "pelvic"],
} as const;
