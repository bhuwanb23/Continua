import { readFile } from "node:fs/promises";
import { DataIntegrityError } from "@/lib/errors";
import type { CachedArtifact } from "@/lib/cache/contract";
import type { DemoCacheRepository } from "./types";

export async function readJsonFile<T>(path: string): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (cause) {
    throw new DataIntegrityError(`Unable to read JSON file: ${path}`, { cause });
  }
  try {
    return JSON.parse(raw) as T;
  } catch (cause) {
    throw new DataIntegrityError(`Invalid JSON in: ${path}`, { cause });
  }
}

export class JsonFileStore {
  constructor(private readonly filePath: string) {}

  async read<T>(): Promise<T> {
    return readJsonFile<T>(this.filePath);
  }
}

/** File-backed cache repository; writes are the caller's responsibility in Phase 1. */
export class JsonFileDemoCacheRepository implements DemoCacheRepository {
  private readonly memory = new Map<string, CachedArtifact<unknown>>();

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    const all = await readJsonFile<Record<string, CachedArtifact<unknown>>>(this.filePath);
    for (const [key, artifact] of Object.entries(all)) {
      this.memory.set(key, artifact);
    }
  }

  async get<T>(key: string): Promise<CachedArtifact<T> | null> {
    const artifact = this.memory.get(key);
    return artifact ? (artifact as CachedArtifact<T>) : null;
  }

  async set<T>(key: string, artifact: CachedArtifact<T>): Promise<void> {
    this.memory.set(key, artifact as CachedArtifact<unknown>);
  }
}
