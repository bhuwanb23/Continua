import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LEAKAGE_TOKENS } from "@/lib/cache/evaluation";
import { auditRuntimeImports } from "../../scripts/lib/safety-audits";

const ROOT = process.cwd();

describe("benchmark isolation", () => {
  it("never imports benchmark truth, generators, or test fixtures at runtime", () => {
    const audit = auditRuntimeImports();
    expect(audit.violations).toEqual([]);
    expect(audit.scanned).toBeGreaterThan(20);
  });

  it("keeps label tokens out of every demo cache artifact", () => {
    const dir = join(ROOT, "data", "demo-cache", "continua-demo-cache-v1");
    for (const name of ["verified-gaps.json", "evidence.json", "queue.json", "patients.json", "evaluation.json", "panel.json"]) {
      const text = readFileSync(join(dir, name), "utf8");
      for (const token of LEAKAGE_TOKENS) expect(text).not.toContain(token);
    }
  });

  it("exposes no truth or label route", () => {
    const routes = [
      "app/api/v1/panels/[panelId]/route.ts",
      "app/api/v1/panels/[panelId]/patients/route.ts",
      "app/api/v1/panels/[panelId]/queue/route.ts",
      "app/api/v1/patients/[patientId]/route.ts",
      "app/api/v1/patients/[patientId]/gaps/route.ts",
      "app/api/v1/patients/[patientId]/timeline/route.ts",
      "app/api/v1/evidence/[gapId]/route.ts",
      "app/api/v1/evaluation/route.ts",
      "app/api/v1/metrics/route.ts",
      "app/api/v1/health/route.ts",
      "app/api/v1/readiness/route.ts",
    ];
    for (const route of routes) {
      expect(readFileSync(join(ROOT, route), "utf8")).not.toMatch(/ground[-_]?truth|truth_gap_id|negative_manifest/);
    }
  });

  it("does not serialize benchmark internals into API DTOs", () => {
    const dto = readFileSync(join(ROOT, "lib/api/dto.ts"), "utf8");
    for (const token of LEAKAGE_TOKENS) expect(dto).not.toContain(token);
  });
});
