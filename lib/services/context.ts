import type { JsonDemoRepository } from "@/lib/repositories/json-demo-repository";
import { getJsonDemoRepository } from "@/lib/repositories/json-demo-repository";

export const DEMO_PANEL_ID = "demo";

let sharedRepository: JsonDemoRepository | null = null;

/**
 * Resolves the process-wide, already validated demo repository. Services never
 * touch the filesystem directly; swapping storage means swapping this factory.
 */
export function demoRepository(): JsonDemoRepository {
  if (!sharedRepository) {
    sharedRepository = getJsonDemoRepository();
  }
  return sharedRepository;
}

/** Test-only hook so suites can point services at a fixture cache directory. */
export function setDemoRepositoryForTests(repository: JsonDemoRepository | null): void {
  sharedRepository = repository;
}
