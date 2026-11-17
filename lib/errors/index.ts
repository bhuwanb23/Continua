import type { ApiErrorCode, ApiErrorEnvelope } from "@/lib/domain/api";

export interface AppErrorOptions {
  code?: ApiErrorCode;
  status?: number;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = options.code ?? "internal_error";
    this.status = options.status ?? 500;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }

  toEnvelope(): ApiErrorEnvelope {
    return { error: { code: this.code, message: this.message } };
  }
}

export class ConfigError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "internal_error", status: 500, ...options });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "invalid_payload", status: 400, ...options });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "patient_not_found", status: 404, ...options });
  }
}

export class PipelineError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "pipeline_error", status: 500, ...options });
  }
}

export class DataIntegrityError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "internal_error", status: 500, ...options });
  }
}

export class GroundingError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "gap_not_grounded", status: 404, ...options });
  }
}
