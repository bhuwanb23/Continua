import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { LegacyClinicalEvent, SourceRecord } from "@/lib/domain";
import { DATASET_VERSION, EVAL_VERSION } from "@/lib/domain/versions";
import { matchExtractionEvents } from "@/lib/evaluation/extraction-matching";
import type { ExtractionGoldEvent, ExtractionPrediction } from "@/lib/evaluation/types";

const root = process.cwd();

interface Rejection {
  code: string;
  stage: string;
  reason: string;
  candidate_event: unknown;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function excerpt(text: string, span: string | undefined): string {
  if (span && span.length > 0) {
    const at = text.indexOf(span);
    if (at >= 0) {
      const start = Math.max(0, at - 80);
      const end = Math.min(text.length, at + span.length + 80);
      return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ")}${end < text.length ? "…" : ""}`;
    }
  }
  return `${text.slice(0, 200).replace(/\s+/g, " ")}…`;
}

function candidateField(candidate: unknown, key: string): string {
  if (!candidate || typeof candidate !== "object") return "—";
  const value = (candidate as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "—";
}

function main(): void {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: tsx scripts/inspect-extraction-errors.ts --run <artifacts/extraction/run-dir> [--out <file>]");
    process.exit(0);
  }
  const runDir = argValue("--run");
  if (!runDir) throw new Error("--run <dir> is required (output of scripts/run-extraction.ts)");

  const metadata = readJson<{
    run_id: string;
    partition: string;
    extractor: string;
    model_id: string;
    timestamp: string;
    git_commit: string;
  }>(join(runDir, "metadata.json"));
  const predictions = readJson<{ extraction_predictions: ExtractionPrediction[] }>(
    join(runDir, "extraction-predictions.json"),
  ).extraction_predictions;
  const rejections = readJson<{ rejections: Rejection[] }>(join(runDir, "rejections.json")).rejections;
  const failedDocuments = readJson<{
    failed_documents: Array<{ patient_id: string; document_id: string; attempt_count: number; error: string }>;
  }>(join(runDir, "errors.json")).failed_documents;
  const runPatients = new Set(
    readJson<Array<{ patient_id: string }>>(join(runDir, "patients.json")).map((patient) => patient.patient_id),
  );

  const gold = readJson<{ extraction_gold: ExtractionGoldEvent[] }>(
    join(root, "data", "eval-set", EVAL_VERSION, "benchmark-contracts.json"),
  ).extraction_gold.filter((event) => runPatients.has(event.patient_id));
  const records = readJson<{ records: SourceRecord[] }>(
    join(root, "data", "synthetic", DATASET_VERSION, "records.json"),
  ).records.filter((record) => runPatients.has(record.patient_id));
  const truth = readJson<{ events: LegacyClinicalEvent[] }>(
    join(root, "data", "generator", "truth-events", "truth-events.json"),
  ).events.filter((event) => runPatients.has(event.patient_id));

  const recordById = new Map(records.map((record) => [record.source_doc_id, record]));
  const scoped = matchExtractionEvents(gold, predictions, { records });
  const goldById = new Map(gold.map((event) => [event.gold_event_id, event]));
  const predictionById = new Map(predictions.map((event) => [event.event_id, event]));
  const truthKeys = new Set(
    truth.map((event) => `${event.patient_id}|${event.event_type}|${event.date}|${event.source_doc_id}`),
  );

  const lines: string[] = [];
  lines.push(`# Extraction failure analysis — ${metadata.run_id}`);
  lines.push("");
  lines.push(
    `Run: ${metadata.timestamp} · partition ${metadata.partition} · extractor ${metadata.extractor} (${metadata.model_id}) · commit ${metadata.git_commit || "unknown"}`,
  );
  if (metadata.extractor === "fixture") {
    lines.push("");
    lines.push("> Fixture-derived run: offline plumbing proof, never model performance.");
  }
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Gold events (run scope): ${scoped.gold_events}`);
  lines.push(`- Predicted events: ${scoped.predicted_events}`);
  lines.push(`- Matched: ${scoped.matched_events}`);
  lines.push(`- Precision / Recall / F1: ${scoped.event_precision ?? "n/a"} / ${scoped.event_recall ?? "n/a"} / ${scoped.event_f1 ?? "n/a"}`);
  lines.push(`- False negatives (EX-01): ${scoped.false_negative_gold_ids.length}`);
  lines.push(`- Unmatched predictions: ${scoped.false_positive_prediction_ids.length}`);
  lines.push(`- Rejected candidates: ${rejections.length}`);
  lines.push(`- Failed documents (EX-15): ${failedDocuments.length}`);
  lines.push("");

  lines.push("## False negatives — gold events missed (EX-01)");
  lines.push("");
  if (scoped.false_negative_gold_ids.length === 0) {
    lines.push("None.");
  } else {
    for (const id of scoped.false_negative_gold_ids) {
      const event = goldById.get(id);
      if (!event) continue;
      const record = recordById.get(event.source_doc_id);
      lines.push(`### ${id}`);
      lines.push("");
      lines.push(`- Patient ${event.patient_id} · ${event.event_type} · ${event.date} · difficulty ${event.difficulty}`);
      lines.push(`- Entity: ${event.normalized_entity ?? "—"} · doc ${event.source_doc_id} (${record?.doc_type ?? "unknown"})`);
      lines.push(`- Gold span: \`${event.source_span}\``);
      if (record) lines.push(`- Document context: ${excerpt(record.text, event.source_span)}`);
      lines.push("- Root cause: unclassified — manual review required.");
      lines.push("");
    }
  }
  lines.push("");

  lines.push("## Unmatched predictions (spurious or outside gold coverage)");
  lines.push("");
  if (scoped.false_positive_prediction_ids.length === 0) {
    lines.push("None.");
  } else {
    let inTruthNotGold = 0;
    let notInTruth = 0;
    for (const id of scoped.false_positive_prediction_ids) {
      const event = predictionById.get(id);
      if (!event) continue;
      const key = `${event.patient_id}|${event.event_type}|${event.date}|${event.source_doc_id}`;
      const covered = truthKeys.has(key);
      if (covered) inTruthNotGold += 1;
      else notInTruth += 1;
      const record = recordById.get(event.source_doc_id);
      lines.push(`### ${id}`);
      lines.push("");
      lines.push(`- Patient ${event.patient_id} · ${event.event_type} · ${event.date} · doc ${event.source_doc_id} (${record?.doc_type ?? "unknown"})`);
      lines.push(`- Entity: ${event.normalized_entity ?? "—"} · span: \`${event.source_span ?? "—"}\``);
      lines.push(
        covered
          ? "- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination)."
          : "- Classification: not present in generator truth — candidate hallucination or date/type/attribution error (EX-02..EX-05).",
      );
      if (record) lines.push(`- Document context: ${excerpt(record.text, event.source_span)}`);
      lines.push("- Root cause: unclassified — manual review required.");
      lines.push("");
    }
    lines.push(`Coverage split: ${inTruthNotGold} outside gold subset · ${notInTruth} not in truth.`);
  }
  lines.push("");

  lines.push("## Rejected candidates");
  lines.push("");
  if (rejections.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Code | Stage | Type | Date | Document | Reason |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const rejection of rejections) {
      lines.push(
        `| ${rejection.code} | ${rejection.stage} | ${candidateField(rejection.candidate_event, "event_type")} | ${candidateField(rejection.candidate_event, "date")} | ${candidateField(rejection.candidate_event, "source_doc_id")} | ${rejection.reason.replace(/\|/g, "\\|")} |`,
      );
    }
  }
  lines.push("");

  lines.push("## Failed documents (EX-15)");
  lines.push("");
  if (failedDocuments.length === 0) {
    lines.push("None.");
  } else {
    for (const failure of failedDocuments) {
      lines.push(`- ${failure.document_id} (patient ${failure.patient_id}): ${failure.attempt_count} attempts — ${failure.error}`);
    }
  }
  lines.push("");

  lines.push("## Root-cause matrix (§5.56)");
  lines.push("");
  lines.push("Assign each failure above to exactly one root cause during review:");
  lines.push("");
  lines.push("| Root cause | Count | Notes |");
  lines.push("| --- | --- | --- |");
  for (const cause of [
    "Prompt",
    "Model capability",
    "Schema",
    "Normalization",
    "Provenance verifier",
    "Reconciliation",
    "Synthetic document ambiguity",
    "Benchmark labeling issue",
  ]) {
    lines.push(`| ${cause} | unclassified | |`);
  }
  lines.push("");
  lines.push(
    "\"Benchmark labeling issue\" is permitted only if genuinely discovered; changing frozen truth requires benchmark governance, not quiet editing.",
  );
  lines.push("");

  const outPath = argValue("--out") ?? join(root, "docs", "extraction", "failure-analysis.md");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Failure analysis written: ${outPath}`);
  console.log(
    `  FN=${scoped.false_negative_gold_ids.length} unmatched=${scoped.false_positive_prediction_ids.length} rejections=${rejections.length} failed_docs=${failedDocuments.length}`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}