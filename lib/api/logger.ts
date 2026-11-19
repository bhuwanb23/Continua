export interface ApiLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  request_id: string;
  route: string;
  status: number;
  duration_ms: number;
  repository_operation?: string;
  result_count?: number;
}

function loggingDisabled(): boolean {
  return process.env.CONTINUA_API_LOG === "off" || process.env.NODE_ENV === "test";
}

/** Metadata only: never patient content, source spans, prompts, or secrets. */
export function logApiRequest(entry: ApiLogEntry): void {
  if (loggingDisabled()) return;
  const line = JSON.stringify({
    ...entry,
    duration_ms: Math.round(entry.duration_ms * 100) / 100,
  });
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.info(line);
}
