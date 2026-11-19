export type ApiErrorCodeV1 =
  | "invalid_request"
  | "invalid_query"
  | "panel_not_found"
  | "patient_not_found"
  | "gap_not_found"
  | "evidence_not_found"
  | "unsupported_action"
  | "demo_cache_not_ready"
  | "cache_version_mismatch"
  | "data_integrity_error"
  | "repository_error"
  | "internal_error";

export class ApiError extends Error {
  readonly code: ApiErrorCodeV1;
  readonly status: number;
  readonly requestId: string;

  constructor(code: ApiErrorCodeV1, message: string, status: number, requestId: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function httpStatusFor(code: ApiErrorCodeV1): number {
  switch (code) {
    case "invalid_request":
    case "invalid_query":
      return 400;
    case "panel_not_found":
    case "patient_not_found":
    case "gap_not_found":
    case "evidence_not_found":
      return 404;
    case "unsupported_action":
      return 422;
    case "demo_cache_not_ready":
    case "cache_version_mismatch":
      return 503;
    case "data_integrity_error":
    case "repository_error":
    case "internal_error":
      return 500;
  }
}

export function toApiError(error: unknown, requestId: string): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && (error as { code?: string }).code === "DEMO_CACHE_INVALID") {
    return new ApiError("demo_cache_not_ready", "Demo data could not be validated.", 503, requestId);
  }
  if (error instanceof Error && (error as { code?: string }).code === "DEMO_CACHE_UNINITIALIZED") {
    return new ApiError("demo_cache_not_ready", "Demo data has not been initialized.", 503, requestId);
  }
  return new ApiError("internal_error", "An unexpected error occurred.", 500, requestId);
}

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCodeV1;
    message: string;
    request_id: string;
  };
}
