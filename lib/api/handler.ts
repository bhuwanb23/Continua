import { performance } from "node:perf_hooks";
import { ZodError } from "zod";
import { ApiError, httpStatusFor, toApiError, type ApiErrorEnvelope } from "./errors";
import { logApiRequest } from "./logger";
import { createRequestId } from "./request-id";
import { ResponseContractError, jsonResponse } from "./responses";

export interface RouteLogContext {
  result_count?: number;
  repository_operation?: string;
}

export interface RouteContext {
  requestId: string;
  log: RouteLogContext;
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorEnvelope = {
    error: { code: error.code, message: error.message, request_id: error.requestId },
  };
  return jsonResponse(body, error.status, error.requestId);
}

function normalizeError(error: unknown, requestId: string): ApiError {
  if (error instanceof ZodError) {
    return new ApiError("invalid_request", "Request parameters failed validation.", 400, requestId);
  }
  if (error instanceof ResponseContractError) {
    return new ApiError("data_integrity_error", "Response contract validation failed.", 500, requestId);
  }
  if (error instanceof ApiError) return error;
  return toApiError(error, requestId);
}

/**
 * Every v1 route runs through this wrapper: request id, structured log,
 * deterministic error mapping, and no raw exception ever reaches the client.
 */
export async function handleApiRequest(
  request: Request,
  route: string,
  run: (context: RouteContext) => Promise<Response>,
): Promise<Response> {
  const requestId = createRequestId();
  const startedAt = performance.now();
  const log: RouteLogContext = {};
  let response: Response;
  try {
    response = await run({ requestId, log });
  } catch (error) {
    const apiError = normalizeError(error, requestId);
    logApiRequest({
      timestamp: new Date().toISOString(),
      level: apiError.status >= 500 ? "error" : "warn",
      request_id: requestId,
      route,
      status: apiError.status,
      duration_ms: performance.now() - startedAt,
      ...(log.repository_operation ? { repository_operation: log.repository_operation } : {}),
    });
    return errorResponse(apiError);
  }

  logApiRequest({
    timestamp: new Date().toISOString(),
    level: response.status >= 500 ? "error" : "info",
    request_id: requestId,
    route,
    status: response.status,
    duration_ms: performance.now() - startedAt,
    ...(log.repository_operation ? { repository_operation: log.repository_operation } : {}),
    ...(log.result_count === undefined ? {} : { result_count: log.result_count }),
  });
  return response;
}

export function notFound(code: "panel_not_found" | "patient_not_found" | "gap_not_found" | "evidence_not_found", message: string, requestId: string): ApiError {
  return new ApiError(code, message, httpStatusFor(code), requestId);
}
