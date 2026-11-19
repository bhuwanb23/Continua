import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadBenchmarkReport, loadBenchmarkVerifiedGaps } from "@/lib/cache/benchmark-report";
import { cacheDirFor, validateDemoCache, type CacheValidationReport } from "@/lib/cache/validate";

export const CACHE_DIR = cacheDirFor();
export const TEST_TMP_ROOT = join(process.cwd(), "data", "demo-cache", ".tests");

export function readCacheJson<T>(name: string, dir = CACHE_DIR): T {
  return JSON.parse(readFileSync(join(dir, name), "utf8")) as T;
}

export function writeCacheJson(dir: string, name: string, value: unknown): void {
  writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const createdDirs = new Set<string>();

export function copyCache(label: string): string {
  mkdirSync(TEST_TMP_ROOT, { recursive: true });
  const dir = join(TEST_TMP_ROOT, label);
  rmSync(dir, { recursive: true, force: true });
  cpSync(CACHE_DIR, dir, { recursive: true });
  createdDirs.add(dir);
  return dir;
}

/** Removes only the copies this test file created, so parallel files never collide. */
export function cleanupCacheCopies(): void {
  for (const dir of createdDirs) rmSync(dir, { recursive: true, force: true });
  createdDirs.clear();
}

export function validateDir(dir: string): CacheValidationReport {
  return validateDemoCache({ dir, frozenReport: loadBenchmarkReport(), benchmarkGaps: loadBenchmarkVerifiedGaps() });
}
