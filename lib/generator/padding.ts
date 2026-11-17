/**
 * Neutral documentation sentences. They must never introduce a referral,
 * medication start/stop, lab result, imaging order, or specialty consult,
 * because that would corrupt the planted truth.
 */
const NEUTRAL_SENTENCES = [
  "Patient reports doing well overall.",
  "No new concerns were raised during the visit.",
  "Care plan reviewed and agreed upon with the patient.",
  "Vital signs stable per nursing documentation.",
  "Patient denies any new symptoms today.",
  "Follow-up instructions were provided in writing.",
  "Transportation and scheduling needs were reviewed.",
  "Records were requested from outside facilities.",
  "Patient prefers to be contacted in the afternoon.",
  "Interpretation services were not required.",
  "No allergies were reported.",
  "Pharmacy benefit information was confirmed.",
  "Patient education materials were provided.",
  "Coordination with the care team was documented.",
  "The patient confirmed understanding of the plan.",
  "Appointment reminders were enabled.",
  "Insurance eligibility was verified for the visit.",
  "The patient has a reliable phone number on file.",
  "Waiting-room instructions were reviewed.",
  "A copy of the visit summary was offered.",
  "The patient declined additional handouts.",
  "No barriers to attendance were identified.",
  "The caregiver was included in the discussion with consent.",
  "The patient asked questions and they were answered.",
  "Documentation was completed at the point of care.",
  "The patient confirmed the preferred pharmacy.",
  "Scheduling preferences were updated in the record.",
  "A reminder letter was queued for mailing.",
  "The patient reports adequate social support.",
  "No urgent concerns were identified during intake.",
  "The visit concluded without incident.",
  "The patient was escorted to the front desk.",
  "Contact information was confirmed as accurate.",
  "The patient acknowledged the cancellation policy.",
  "A follow-up reminder will be sent by the care team.",
  "The patient requested a paper copy of instructions.",
  "No further coordination is needed at this time.",
  "The chart was reviewed before the visit.",
  "The patient arrived on time for the appointment.",
  "All questions were addressed to the patient's satisfaction.",
];

export type LengthBand = "short" | "medium" | "long";

export function lengthBand(patientIndex: number, docIndex: number): LengthBand {
  const bucket = (patientIndex * 13 + docIndex * 7) % 20;
  if (bucket < 5) return "short";
  if (bucket < 16) return "medium";
  return "long";
}

export function targetWords(patientIndex: number, docIndex: number): number {
  const band = lengthBand(patientIndex, docIndex);
  const jitter = (patientIndex * 17 + docIndex * 11) % 80;
  if (band === "short") return 60 + jitter;
  if (band === "medium") return 160 + ((patientIndex * 29 + docIndex * 19) % 200);
  return 400 + ((patientIndex * 31 + docIndex * 23) % 300);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/** Append neutral, non-triggering prose until the target length is reached. */
export function padText(text: string, target: number, seed: number): string {
  let output = text.trimEnd();
  if (wordCount(output) >= target) return output;

  let index = seed % NEUTRAL_SENTENCES.length;
  while (wordCount(output) < target) {
    const sentence = NEUTRAL_SENTENCES[index % NEUTRAL_SENTENCES.length] as string;
    output += ` ${sentence}`;
    index += 1;
    if (index % 6 === 0) output += "\n";
  }
  return output;
}
