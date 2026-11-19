import type { BenchmarkConfig, CostReport } from "./types";
import { extractionMetadataFor, providerState } from "./metadata";

export function buildCostReport(config: BenchmarkConfig, documentCount: number): CostReport {
  const metadata = extractionMetadataFor(config.extracted_events_path);
  const provider = providerState();
  const mode = typeof metadata?.["extractor"] === "string" ? metadata["extractor"] : "unknown";
  return {
    status: "not_run",
    llm_calls: 0,
    documents: documentCount,
    tokens: { input: null, output: null, total: null, cached_input: null },
    provider_model: mode === "fixture" ? "fixture" : provider.model,
    pricing_basis: "none",
    pricing_date: null,
    cost_usd: null,
    cost_per_document_usd: null,
    cost_per_patient_usd: null,
    cost_per_panel_usd: null,
    measured: false,
    note:
      mode === "fixture"
        ? "No live LLM calls or token usage exist in the fixture replay. Dollar cost is not measured and is reported as null."
        : "No token usage or current provider price was available in this run; dollar cost is reported as null.",
  };
}
