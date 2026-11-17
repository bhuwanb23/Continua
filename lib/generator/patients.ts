import { deterministicId } from "@/lib/ids";
import { addDays } from "./dates";
import { COHORT_COUNTS, DATASET_VERSION } from "./config";
import type { Cohort, Difficulty, Specialty, SyntheticPatient } from "./types";

const FIRST_NAMES = [
  "Amara", "Brian", "Carla", "Devon", "Elena", "Farid", "Gloria", "Hector",
  "Imani", "Jonah", "Keiko", "Luis", "Maya", "Nolan", "Olivia", "Pavel",
  "Quinn", "Rosa", "Simon", "Tara",
];

const LAST_NAMES = [
  "Adeyemi", "Brennan", "Castillo", "Dawson", "Eriksen", "Foster", "Gupta",
  "Holloway", "Ibrahim", "Jensen", "Kowalski", "Lopez", "Mensah", "Nguyen",
  "Osei", "Petrov", "Quintero", "Reyes", "Sullivan", "Tanaka",
];

const ONCOLOGY_CONDITIONS = [
  { condition: "breast_cancer", diagnosis: "Breast cancer — post-surgical", pathway: "oncology" as Specialty, sex: "F" as const },
  { condition: "colorectal_cancer", diagnosis: "Colorectal cancer — surveillance", pathway: "oncology" as Specialty, sex: null },
  { condition: "prostate_cancer", diagnosis: "Prostate cancer — surveillance", pathway: "oncology" as Specialty, sex: "M" as const },
  { condition: "lung_cancer", diagnosis: "Lung cancer — treatment planning", pathway: "oncology" as Specialty, sex: null },
  { condition: "post_surgical_oncology", diagnosis: "Post-surgical oncology navigation", pathway: "surgery" as Specialty, sex: null },
];

const CARDIO_CONDITIONS = [
  { condition: "heart_failure", diagnosis: "Heart failure — reduced ejection fraction", pathway: "cardiology" as Specialty },
  { condition: "atrial_fibrillation", diagnosis: "Atrial fibrillation", pathway: "cardiology" as Specialty },
  { condition: "coronary_artery_disease", diagnosis: "Coronary artery disease", pathway: "cardiology" as Specialty },
  { condition: "hypertension_specialty", diagnosis: "Hypertension — specialty referral", pathway: "cardiology" as Specialty },
];

const METABOLIC_CONDITIONS = [
  { condition: "type_2_diabetes", diagnosis: "Type 2 diabetes mellitus", pathway: "endocrinology" as Specialty },
  { condition: "hypertension", diagnosis: "Essential hypertension", pathway: "primary_care" as Specialty },
  { condition: "prediabetes", diagnosis: "Prediabetes", pathway: "primary_care" as Specialty },
];

const MIXED_CONDITIONS = [
  { condition: "asthma", diagnosis: "Asthma", pathway: "primary_care" as Specialty },
  { condition: "chronic_kidney_disease", diagnosis: "Chronic kidney disease stage 3", pathway: "primary_care" as Specialty },
  { condition: "hypothyroidism", diagnosis: "Hypothyroidism", pathway: "primary_care" as Specialty },
  { condition: "gerd", diagnosis: "Gastroesophageal reflux disease", pathway: "primary_care" as Specialty },
  { condition: "osteoarthritis", diagnosis: "Osteoarthritis", pathway: "primary_care" as Specialty },
];

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function cohortFor(index: number): Cohort {
  if (index < COHORT_COUNTS.oncology) return "oncology";
  if (index < COHORT_COUNTS.oncology + COHORT_COUNTS.cardio) return "cardio";
  if (index < COHORT_COUNTS.oncology + COHORT_COUNTS.cardio + COHORT_COUNTS.metabolic) {
    return "metabolic";
  }
  return "mixed";
}

function difficultyFor(index: number): Difficulty {
  if (index === 0) return "HARD";
  const bucket = index % 3;
  return bucket === 0 ? "EASY" : bucket === 1 ? "MEDIUM" : "HARD";
}

export function buildPatients(): SyntheticPatient[] {
  const patients: SyntheticPatient[] = [];

  patients.push({
    patient_id: deterministicId("patient", "P-001-maria"),
    fixture_key: "P-001-maria",
    display_name: "Maria Chen",
    birth_year: 1972,
    sex: "F",
    demo_age: 54,
    primary_condition: "breast_cancer",
    primary_diagnosis: "Breast cancer — post-surgical",
    care_pathway: "oncology",
    cohort: "oncology",
    difficulty: "HARD",
    last_contact_date: "2026-04-28",
    dataset_version: DATASET_VERSION,
    synthetic: true,
  });

  for (let index = 1; index < 80; index += 1) {
    const first = FIRST_NAMES[index % FIRST_NAMES.length] as string;
    const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length] as string;
    const displayName = `${first} ${last}`;
    const cohort = cohortFor(index);

    let condition: string;
    let diagnosis: string;
    let pathway: Specialty;
    let sex: "F" | "M" | "X";

    if (cohort === "oncology") {
      const item = ONCOLOGY_CONDITIONS[index % ONCOLOGY_CONDITIONS.length] as (typeof ONCOLOGY_CONDITIONS)[number];
      condition = item.condition;
      diagnosis = item.diagnosis;
      pathway = item.pathway;
      sex = item.sex ?? (index % 2 === 0 ? "F" : "M");
    } else if (cohort === "cardio") {
      const item = CARDIO_CONDITIONS[index % CARDIO_CONDITIONS.length] as (typeof CARDIO_CONDITIONS)[number];
      condition = item.condition;
      diagnosis = item.diagnosis;
      pathway = item.pathway;
      sex = index % 2 === 0 ? "M" : "F";
    } else if (cohort === "metabolic") {
      const item = METABOLIC_CONDITIONS[index % METABOLIC_CONDITIONS.length] as (typeof METABOLIC_CONDITIONS)[number];
      condition = item.condition;
      diagnosis = item.diagnosis;
      pathway = item.pathway;
      sex = index % 2 === 0 ? "F" : "M";
    } else {
      const item = MIXED_CONDITIONS[index % MIXED_CONDITIONS.length] as (typeof MIXED_CONDITIONS)[number];
      condition = item.condition;
      diagnosis = item.diagnosis;
      pathway = item.pathway;
      sex = index % 2 === 0 ? "M" : "F";
    }

    const age = 36 + ((index * 7) % 44);
    const fixtureKey = `P-${String(index + 1).padStart(3, "0")}-${slug(displayName)}`;

    patients.push({
      patient_id: deterministicId("patient", fixtureKey),
      fixture_key: fixtureKey,
      display_name: displayName,
      birth_year: 2026 - age,
      sex,
      demo_age: age,
      primary_condition: condition,
      primary_diagnosis: diagnosis,
      care_pathway: pathway,
      cohort,
      difficulty: difficultyFor(index),
      last_contact_date: addDays("2026-04-15", index % 20),
      dataset_version: DATASET_VERSION,
      synthetic: true,
    });
  }

  return patients;
}
