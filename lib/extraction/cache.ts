import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CachedArtifact } from "@/lib/cache/contract";

function sha256(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export interface CandidateCacheKeyInput {
  content_hash: string;
  model_id: string;
  prompt_version: string;
  candidate_schema_version: string;
}

export interface CanonicalCacheKeyInput extends CandidateCacheKeyInput {
  normalization_version: string;
  clinical_event_schema: string;
  reconciliation_version: string;
}

export function candidateCacheKey(input: CandidateCacheKeyInput): string {
  return sha256([input.content_hash, input.model_id, input.prompt_version, input.candidate_schema_version]);
}

/** Normalization/schema/reconciliation bumps invalidate canonical output even when extraction is unchanged. */
export function canonicalCacheKey(input: CanonicalCacheKeyInput): string {
  return sha256([
    candidateCacheKey(input),
    input.normalization_version,
    input.clinical_event_schema,
    input.reconciliation_version,
  ]);
}

export interface ExtractionCacheRepository {
  get<T>(key: string): Promise<CachedArtifact<T> | null>;
  set<T>(key: string, artifact: CachedArtifact<T>): Promise<void>;
}

export class MemoryExtractionCache implements ExtractionCacheRepository {
  private readonly entries = new Map<string, CachedArtifact<unknown>>();

  async get<T>(key: string): Promise<CachedArtifact<T> | null> {
    return (this.entries.get(key) as CachedArtifact<T> | undefined) ?? null;
  }

  async set<T>(key: string, artifact: CachedArtifact<T>): Promise<void> {
    this.entries.set(key, artifact as CachedArtifact<unknown>);
  }
}

/** File-backed cache under artifacts/extraction/cache/. Missing file = empty cache. */
export class FileExtractionCache implements ExtractionCacheRepository {
  private entries = new Map<string, CachedArtifact<unknown>>();

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch {
      this.entries = new Map();
      return;
    }
    const parsed = JSON.parse(raw) as Record<string, CachedArtifact<unknown>>;
    this.entries = new Map(Object.entries(parsed));
  }

  async get<T>(key: string): Promise<CachedArtifact<T> | null> {
    return (this.entries.get(key) as CachedArtifact<T> | undefined) ?? null;
  }

  async set<T>(key: string, artifact: CachedArtifact<T>): Promise<void> {
    this.entries.set(key, artifact as CachedArtifact<unknown>);
  }

  async flush(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const object = Object.fromEntries([...this.entries.entries()].sort(([left], [right]) => left.localeCompare(right)));
    await writeFile(this.filePath, JSON.stringify(object, null, 2) + "\n", "utf8");
  }
}