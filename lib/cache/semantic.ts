import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalStringify } from "./canonical-json";
import { sha256Text } from "./hashes";

/** Keys whose values are build timestamps, not cache semantics (Phase 10.25). */
const VOLATILE_KEYS = new Set(["generated_at", "built_at", "finalized_at"]);

function stripVolatile(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripVolatile);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (VOLATILE_KEYS.has(key)) continue;
      result[key] = stripVolatile(entry);
    }
    return result;
  }
  return value;
}

function semanticHash(value: unknown): string {
  return sha256Text(canonicalStringify(stripVolatile(value)));
}

/**
 * Content hash over the cache semantics: canonical JSON with volatile build
 * timestamps removed. The manifest is reduced to its semantic artifact hashes,
 * so two builds from identical frozen artifacts match here even though their
 * byte-level hashes differ by `generated_at`.
 */
export function semanticCacheHashes(dir: string): Record<string, string> {
  const parsed: Record<string, unknown> = {};
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json")) continue;
    parsed[name] = JSON.parse(readFileSync(join(dir, name), "utf8")) as unknown;
  }
  const hashes: Record<string, string> = {};
  const manifest = parsed["manifest.json"] as Record<string, unknown> | undefined;
  for (const [name, value] of Object.entries(parsed)) {
    if (name === "manifest.json") continue;
    hashes[name] = semanticHash(value);
  }
  if (manifest) {
    const { manifest_sha256, artifacts, ...rest } = manifest;
    void manifest_sha256;
    const semanticArtifacts: Record<string, string> = {};
    for (const name of Object.keys((artifacts as Record<string, unknown>) ?? {}).sort()) {
      semanticArtifacts[name] = hashes[name] ?? "missing";
    }
    hashes["manifest.json"] = semanticHash({ ...rest, artifacts: semanticArtifacts });
  }
  return hashes;
}
