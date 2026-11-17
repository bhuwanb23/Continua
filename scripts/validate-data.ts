import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { EvalResultSchema, FixtureSchema } from "@/lib/schemas";
import { VERSION_METADATA } from "@/lib/domain/versions";

const root = process.cwd();
const failures: string[] = [];

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as unknown;
}

const VersionsFileSchema = z.object({
  spec_version: z.literal("1.0"),
  dataset: z.literal("continua-synth-v1"),
  eval: z.literal("continua-eval-v1"),
  extractor: z.literal("extractor-v1"),
  detector: z.literal("gaps-v1"),
  priority: z.literal("priority-v1"),
  api: z.literal("v1"),
  evaluation_as_of_date: z.literal("2026-06-05"),
});

const versions = VersionsFileSchema.safeParse(readJson("data/spec/versions.json"));
if (!versions.success) {
  failures.push("versions.json does not match the frozen version manifest");
}

const codeVersions = VERSION_METADATA;
if (
  codeVersions.spec_version !== "1.0" ||
  codeVersions.dataset_version !== "continua-synth-v1" ||
  codeVersions.eval_version !== "continua-eval-v1" ||
  codeVersions.extractor_version !== "extractor-v1" ||
  codeVersions.detector_version !== "gaps-v1" ||
  codeVersions.priority_version !== "priority-v1" ||
  codeVersions.api_version !== "v1"
) {
  failures.push("code version metadata drifts from the frozen manifest");
}

const BenchmarkManifestSchema = z.object({
  eval_set_id: z.string(),
  evaluation_as_of_date: z.literal("2026-06-05"),
  panel: z.object({
    patient_count: z.literal(80),
    positive_patients: z.literal(40),
    negative_patients: z.literal(40),
    ground_truth_gaps: z.literal(70),
    by_type: z.object({
      missed_followup: z.literal(28),
      duplicate_test: z.literal(22),
      med_monitoring: z.literal(20),
    }),
  }),
  hard_negative_families: z.array(z.object({ id: z.string(), name: z.string() })).length(10),
});

const manifest = BenchmarkManifestSchema.safeParse(readJson("data/spec/benchmark-manifest.json"));
if (!manifest.success) {
  failures.push("benchmark-manifest.json does not match the frozen composition");
}

const goldenCase = z
  .object({
    evaluation_as_of_date: z.literal("2026-06-05"),
    patient_priority: z.object({ patient_priority_score: z.literal(74) }),
    gaps: z
      .array(
        z.object({
          gap_type: z.enum(["missed_followup", "duplicate_test", "med_monitoring"]),
          priority: z.object({ gap_priority_score: z.number() }),
        }),
      )
      .length(3),
  })
  .safeParse(readJson("data/spec/maria-golden-case.json"));
if (!goldenCase.success) {
  failures.push("maria-golden-case.json does not match the frozen golden case");
}

const fixture = FixtureSchema.safeParse(readJson("data/fixtures/maria-minimal.json"));
if (!fixture.success) {
  failures.push("data/fixtures/maria-minimal.json does not match the fixture contract");
}

const evalReport = EvalResultSchema.safeParse(readJson("eval-report.json"));
if (!evalReport.success) {
  failures.push("eval-report.json does not match EvalResultSchema");
}

if (failures.length > 0) {
  console.error("Data validation failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Data validation passed: frozen artifacts are consistent.");
