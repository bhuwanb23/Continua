import { createHash } from "node:crypto";
import { canonicalStringify } from "./canonical-json";

export function sha256Text(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Json(value: unknown): string {
  return sha256Text(canonicalStringify(value));
}

export function sha256FileContent(content: string | Buffer): string {
  return sha256Text(content);
}
