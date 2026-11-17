export const DISCLAIMER =
  "Synthetic demo data. For coordinator verification only. Not medical advice.";

export const SYNTHETIC_BANNER =
  "Synthetic demo data. No real patient information. For coordinator verification only.";

export const API_ERROR_CODES = [
  "panel_not_found",
  "patient_not_found",
  "gap_not_found",
  "gap_not_grounded",
  "invalid_payload",
  "pipeline_error",
  "internal_error",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
