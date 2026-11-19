import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cacheDirFor } from "@/lib/cache/validate";

export const CACHE_DIR = cacheDirFor();
export const BASE_URL = "http://localhost:3000";

export type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

/** Narrows a Next route export to the shared test handler shape. */
export function asHandler(handler: unknown): RouteHandler {
  return handler as RouteHandler;
}

export interface InvokeOptions {
  path: string;
  params?: Record<string, string>;
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

export interface ApiResult<T = Record<string, unknown>> {
  status: number;
  headers: Headers;
  body: T;
  text: string;
}

export async function invoke<T = Record<string, unknown>>(
  handler: RouteHandler,
  options: InvokeOptions,
): Promise<ApiResult<T>> {
  const request = new Request(`${BASE_URL}${options.path}`, {
    method: options.method ?? "GET",
    ...(options.body === undefined ? {} : { body: options.body }),
    ...(options.headers === undefined ? {} : { headers: options.headers }),
  });
  const response = await handler(request, { params: Promise.resolve(options.params ?? {}) });
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: JSON.parse(text) as T,
    text,
  };
}

export async function invokeGet<T = Record<string, unknown>>(
  handler: RouteHandler,
  path: string,
  params: Record<string, string> = {},
): Promise<ApiResult<T>> {
  return invoke<T>(handler, { path, params });
}

export function readCache<T>(name: string): T {
  return JSON.parse(readFileSync(join(CACHE_DIR, name), "utf8")) as T;
}

export function expectMeta(meta: unknown, requestId: string): void {
  const value = meta as {
    api_version: string;
    synthetic: boolean;
    evaluation_as_of_date: string;
    request_id: string;
  };
  if (value.api_version !== "v1") throw new Error("meta.api_version is not v1");
  if (value.synthetic !== true) throw new Error("meta.synthetic is not true");
  if (value.evaluation_as_of_date !== "2026-06-05") throw new Error("meta date drifted");
  if (value.request_id !== requestId) throw new Error("meta.request_id does not match header");
}

export const DISCLAIMER_TEXT =
  "Synthetic demo data. For coordinator verification only. Not medical advice.";
