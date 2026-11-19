export const INTENDED_USE = {
  product: "Continua",
  version_scope: "Phase 15 safety, privacy and responsible AI",
  summary:
    "Continua is a coordinator-facing decision-support tool that surfaces continuity-of-care gaps from synthetic demonstration records and prioritizes review. It does not diagnose, prescribe, or act autonomously.",
  in_scope: [
    "Surfacing verified continuity-of-care gaps with source evidence.",
    "Prioritizing coordinator review queues from verified gaps only.",
    "Explaining why a gap was detected with citation to source documents.",
    "Recording coordinator workflow actions (acknowledged, contacted, reviewed).",
    "Demonstrating the pipeline on synthetic data for evaluation purposes.",
  ],
  out_of_scope: [
    "Diagnosis or clinical assessment of any patient.",
    "Treatment selection, dosing, or medication management.",
    "Real-time or live clinical decision support on real patient data.",
    "Autonomous outreach, scheduling, or ordering.",
    "Replacement of clinical judgment or coordinator review.",
  ],
  intended_users: ["care coordinators", "care navigators", "quality and operations staff"],
  setting: "Offline synthetic demonstration and evaluation environment",
  required_conditions: [
    "All inputs are synthetic demonstration data.",
    "Every displayed gap is verified against source evidence.",
    "A human coordinator reviews and acts on each item.",
    "The system is not connected to a live EHR or patient portal.",
  ],
} as const;
