import type { SyntheticPatient, SyntheticProvider } from "./types";
import { abbreviate, copiedForwardSentence, dateText, providerNameVariant } from "./messiness";

export interface RenderResult {
  text: string;
  span: string;
  templateId: string;
}

interface BaseArgs {
  patient: SyntheticPatient;
  provider: SyntheticProvider;
  date: string;
  variant: number;
}

function header(title: string, arg: BaseArgs): string {
  const who = providerNameVariant(arg.provider, arg.variant);
  const when = dateText(arg.date, arg.variant);
  return `${title}\nDate: ${when}\nProvider: ${who}\nOrganization: ${arg.provider.organization}\nPatient: ${arg.patient.display_name}\n`;
}

export interface ReferralArgs extends BaseArgs {
  specialtyLabel: string;
  reason: string;
  windowDays: number;
}

export function renderReferral(arg: ReferralArgs): RenderResult {
  const span = `Referral to ${arg.specialtyLabel} for ${arg.reason}. Please schedule within ${arg.windowDays} days.`;
  const templates = [
    () =>
      `${header("REFERRAL REQUEST", arg)}\nReason for referral: ${arg.reason}\n\n${span}\n\nCoordinator to contact the patient and confirm scheduling.`,
    () =>
      `${header("SPECIALTY REFERRAL", arg)}\n${arg.patient.display_name} is being referred to ${arg.specialtyLabel}.\n${span}\nPlease route records and contact the patient.`,
    () =>
      `${header("OUTGOING REFERRAL", arg)}\n${abbreviate("Patient was seen today and a referral was placed.", arg.variant)}\n${span}\nRecords to be forwarded with the request.`,
  ];
  return {
    text: (templates[arg.variant % templates.length] as () => string)(),
    span,
    templateId: `referral-${arg.variant % templates.length}`,
  };
}

export interface ConsultArgs extends BaseArgs {
  specialtyLabel: string;
  summary: string;
  telehealth: boolean;
}

export function renderConsult(arg: ConsultArgs): RenderResult {
  const mode = arg.telehealth ? " via telehealth" : "";
  const span = `${arg.specialtyLabel} consultation completed${mode}. ${arg.summary}`;
  const templates = [
    () =>
      `${header(`${arg.specialtyLabel.toUpperCase()} CONSULTATION`, arg)}\n${span}\n\nAssessment and plan discussed with the patient. ${copiedForwardSentence(arg.variant)}`,
    () =>
      `${header("CONSULT NOTE", arg)}\n${abbreviate("Consultation performed and findings reviewed.", arg.variant)}\n${span}\nNo further specialty follow-up required at this time.`,
    () =>
      `${header("SPECIALTY VISIT", arg)}\n${span}\n${abbreviate("Patient tolerated the visit well. Records sent to the referring provider.", arg.variant)}`,
  ];
  return {
    text: (templates[arg.variant % templates.length] as () => string)(),
    span,
    templateId: `consult-${arg.variant % templates.length}`,
  };
}

export interface LabArgs extends BaseArgs {
  alias: string;
  values: string;
}

export function renderLab(arg: LabArgs): RenderResult {
  const span = `${arg.alias}: ${arg.values}.`;
  const templates = [
    () =>
      `${header("LABORATORY REPORT", arg)}\n${span}\nReference ranges provided by the performing laboratory. No critical values called.`,
    () =>
      `${header("LAB RESULTS", arg)}\n${abbreviate("Laboratory results reviewed.", arg.variant)}\n${span}\nSpecimen collected and processed same day.`,
    () =>
      `${header("CLINICAL LABORATORY", arg)}\nTest: ${arg.alias}\nResult: ${arg.values}\n${span}\nResults released to the ordering provider.`,
  ];
  return {
    text: (templates[arg.variant % templates.length] as () => string)(),
    span,
    templateId: `lab-${arg.variant % templates.length}`,
  };
}

export interface ImagingArgs extends BaseArgs {
  modality: string;
  region: string;
  impression: string;
  contrast: boolean;
}

export function renderImaging(arg: ImagingArgs): RenderResult {
  const span = `${arg.modality} of the ${arg.region}${arg.contrast ? " with contrast" : ""}: ${arg.impression}.`;
  const templates = [
    () =>
      `${header("IMAGING REPORT", arg)}\nModality: ${arg.modality}\nBody region: ${arg.region}\n\n${span}\n\nComparison made to prior available imaging.`,
    () =>
      `${header("RADIOLOGY REPORT", arg)}\n${abbreviate("Imaging performed and reviewed by radiology.", arg.variant)}\n${span}\nNo acute findings beyond those described.`,
    () =>
      `${header("DIAGNOSTIC IMAGING", arg)}\n${span}\nTechnique and findings reviewed. Report sent to the ordering provider.`,
  ];
  return {
    text: (templates[arg.variant % templates.length] as () => string)(),
    span,
    templateId: `imaging-${arg.variant % templates.length}`,
  };
}

export interface MedicationArgs extends BaseArgs {
  drug: string;
  dose: string;
  frequency: string;
  reason: string;
  verb: "Started" | "Stopped" | "Continued";
}

export function renderMedication(arg: MedicationArgs): RenderResult {
  const span = `${arg.verb} ${arg.drug} ${arg.dose} ${arg.frequency} for ${arg.reason}.`;
  const templates = [
    () =>
      `${header("MEDICATION RECORD", arg)}\n${span}\nPharmacy: ${arg.provider.organization}. Patient counseled on side effects and adherence.`,
    () =>
      `${header("MEDICATION UPDATE", arg)}\n${abbreviate("Medication list reviewed with the patient.", arg.variant)}\n${span}\nNo new allergies reported.`,
  ];
  return {
    text: (templates[arg.variant % templates.length] as () => string)(),
    span,
    templateId: `medication-${arg.variant % templates.length}`,
  };
}

export interface PhoneArgs extends BaseArgs {
  summary: string;
}

export function renderPhone(arg: PhoneArgs): RenderResult {
  const span = `Phone follow-up: ${arg.summary}`;
  const templates = [
    () => `${header("TELEPHONE ENCOUNTER", arg)}\n${span}\nPatient reached by phone. No acute concerns reported.`,
    () => `${header("PHONE NOTE", arg)}\n${span}\nMessage left with patient; call returned same day.`,
  ];
  return {
    text: (templates[arg.variant % templates.length] as () => string)(),
    span,
    templateId: `phone-${arg.variant % templates.length}`,
  };
}

export interface SurgeryArgs extends BaseArgs {
  procedure: string;
}

export function renderSurgery(arg: SurgeryArgs): RenderResult {
  const span = `Underwent ${arg.procedure} on ${arg.date}.`;
  const text = `${header("SURGICAL SUMMARY", arg)}\n${span}\nPost-operative course uncomplicated. Discharged with standard instructions.`;
  return { text, span, templateId: "surgery-0" };
}

export interface NoteArgs extends BaseArgs {
  topic: string;
  body: string;
}

export function renderNote(arg: NoteArgs): RenderResult {
  const span = arg.body;
  const text = `${header("PROGRESS NOTE", arg)}\n${arg.topic}\n${span}\n${abbreviate(
    "Patient reports doing well overall. Medication list reviewed. Follow up with PCP as planned.",
    arg.variant,
  )}`;
  return { text, span, templateId: `note-${arg.variant % 3}` };
}
