import { API_VERSION } from "@/lib/api/dto";
import { DEMO_CACHE_VERSION } from "@/lib/cache/version";
import { EVIDENCE_SCHEMA_VERSION, GAP_POLICY_VERSION } from "@/lib/domain";
import { DETECTOR_VERSION, NORMALIZATION_VERSION } from "@/lib/domain/versions";
import { SYNTHETIC_DATASET_VERSION } from "./synthetic-only";

export const SAFETY_VERSION = "continua-safety-v1";

export const SAFETY_FROZEN_ON = "2026-11-19";

export const SAFETY_CORPUS_VERSION = "safety-corpus-v1";

export const SAFETY_REPORT_SCHEMA_VERSION = "safety-report-v1";

export const RISK_REGISTER_VERSION = "risk-register-v1";

export const INCIDENT_PLAYBOOK_VERSION = "incident-playbook-v1";

export const SAFETY_VERSIONS = {
  safety_version: SAFETY_VERSION,
  safety_corpus_version: SAFETY_CORPUS_VERSION,
  safety_report_schema_version: SAFETY_REPORT_SCHEMA_VERSION,
  risk_register_version: RISK_REGISTER_VERSION,
  incident_playbook_version: INCIDENT_PLAYBOOK_VERSION,
  synthetic_dataset_version: SYNTHETIC_DATASET_VERSION,
  demo_cache_version: DEMO_CACHE_VERSION,
  api_version: API_VERSION,
  detector_version: DETECTOR_VERSION,
  evidence_version: EVIDENCE_SCHEMA_VERSION,
  gap_policy_version: GAP_POLICY_VERSION,
  normalization_version: NORMALIZATION_VERSION,
} as const;

export type SafetyVersions = typeof SAFETY_VERSIONS;
