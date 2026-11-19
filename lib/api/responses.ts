import type { ZodType } from "zod";
import { DISCLAIMER } from "@/lib/domain/api";
import { EVALUATION_AS_OF_DATE } from "@/lib/domain/versions";
import { API_VERSION } from "./dto";

export interface ResponseMeta {
  api_version: typeof API_VERSION;
  synthetic: true;
  evaluation_as_of_date: string;
  request_id: string;
}

export function responseMeta(requestId: string): ResponseMeta {
  return {
    api_version: API_VERSION,
    synthetic: true,
    evaluation_as_of_date: EVALUATION_AS_OF_DATE,
    request_id: requestId,
  };
}

export function disclaimer(): string {
  return DISCLAIMER;
}

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  // The server already holds a validated in-memory snapshot; browser or CDN
  // caching would only risk serving a stale cache version after a deploy.
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function jsonResponse(body: unknown, status: number, requestId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...BASE_HEADERS,
      "X-Request-Id": requestId,
      "X-API-Version": API_VERSION,
    },
  });
}

/**
 * Builds the response and parses it through the frozen contract before it
 * leaves the process, so a DTO drift can never be served silently.
 */
export function validateResponse<T>(schema: ZodType<T>, body: T, requestId: string): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.path.join(".") || "(root)").join(", ");
    throw new ResponseContractError(`Response failed continua-api-v1 validation at: ${detail}`, requestId);
  }
  return parsed.data;
}

export function okResponse<T>(schema: ZodType<T>, body: T, requestId: string, status = 200): Response {
  return jsonResponse(validateResponse(schema, body, requestId), status, requestId);
}

export class ResponseContractError extends Error {
  readonly requestId: string;

  constructor(message: string, requestId: string) {
    super(message);
    this.name = "ResponseContractError";
    this.requestId = requestId;
  }
}
