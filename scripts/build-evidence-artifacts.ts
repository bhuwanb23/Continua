import { join } from "node:path";
import {
  EVIDENCE_ARTIFACTS,
  corruptedCandidateBenchmark,
  executeEvidenceRun,
  parseOption,
  writeEvidenceRun,
  writeJson,
} from "./lib/evidence-run";
import { evaluateGroundingRun } from "./lib/evidence-grounding";

function buildRun(runId: string, mode: "oracle" | "extracted", partition: "demo" | "final" | "all", extractedPath?: string) {
  const run = executeEvidenceRun({ runId, mode, partition, extractedPath: extractedPath ?? null });
  const outDir = writeEvidenceRun(run);
  const grounding = evaluateGroundingRun(run);
  writeJson(join(outDir, "grounding-report.json"), grounding);
  return { run, outDir, grounding };
}

function main(): void {
  const extractedPath = parseOption("--extracted") ??
    join(process.cwd(), "artifacts", "extraction", "phase6-extracted-final", "canonical-events.json");

  const oracleFinal = buildRun("phase7-oracle-final", "oracle", "final");
  const oracleAll = buildRun("phase7-oracle-all", "oracle", "all");
  const maria = buildRun("phase7-maria-oracle", "oracle", "demo");
  const extracted = buildRun("phase7-extracted-final", "extracted", "final", extractedPath);

  const corruption = corruptedCandidateBenchmark(oracleFinal.run);
  writeJson(join(oracleFinal.outDir, "corruption-report.json"), corruption);

  const summary = {
    benchmark: "CONTINUA EVIDENCE LAYER V1",
    evidence_version: "evidence-v1",
    verified_gap_version: "verified-gap-v1",
    detector_version: "gaps-v1",
    gap_policy_version: "gap-policy-v1",
    evaluation_as_of_date: "2026-06-05",
    llm_calls: 0,
    oracle_final: {
      candidates: oracleFinal.run.candidates.length,
      verified: oracleFinal.run.verified.length,
      suppressed: oracleFinal.run.suppressed.length,
      grounding: oracleFinal.grounding,
    },
    oracle_all: {
      candidates: oracleAll.run.candidates.length,
      verified: oracleAll.run.verified.length,
      suppressed: oracleAll.run.suppressed.length,
      grounding: oracleAll.grounding,
    },
    maria: {
      candidates: maria.run.candidates.length,
      verified: maria.run.verified.length,
      suppressed: maria.run.suppressed.length,
      grounding: maria.grounding,
    },
    extracted_final: {
      candidates: extracted.run.candidates.length,
      verified: extracted.run.verified.length,
      suppressed: extracted.run.suppressed.length,
      grounding: extracted.grounding,
      note: "Extracted mode uses the local extractor-v1 fixture store unless a live run is supplied.",
    },
    corruption,
  };
  writeJson(join(EVIDENCE_ARTIFACTS, "phase7-benchmark-summary.json"), summary);

  console.log("CONTINUA EVIDENCE LAYER V1");
  console.log(`  oracle final: ${oracleFinal.run.verified.length}/${oracleFinal.run.candidates.length} verified, ${oracleFinal.run.suppressed.length} suppressed`);
  console.log(`  oracle all:   ${oracleAll.run.verified.length}/${oracleAll.run.candidates.length} verified, ${oracleAll.run.suppressed.length} suppressed`);
  console.log(`  maria:        ${maria.run.verified.length}/${maria.run.candidates.length} verified, ${maria.run.suppressed.length} suppressed`);
  console.log(`  extracted:    ${extracted.run.verified.length}/${extracted.run.candidates.length} verified, ${extracted.run.suppressed.length} suppressed`);
  console.log(`  corruption:   ${corruption.rejected}/${corruption.total} rejected`);
  console.log(`  artifacts:    ${EVIDENCE_ARTIFACTS}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
