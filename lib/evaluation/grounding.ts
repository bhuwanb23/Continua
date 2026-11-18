import { FUZZY_SPAN_THRESHOLD } from "./config";
import type {
  EvidenceGroundingResult,
  GapGroundingResult,
  GapPrediction,
  GroundingMetrics,
  SourceRecordLike,
} from "./types";

export interface GroundingOptions {
  fuzzyThreshold?: number;
}

export function normalizeSpanText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeSpanText(value)
    .split(/[^a-z0-9%./-]+/)
    .filter((token) => token.length > 0);
}

function levenshteinDistance<T>(left: T[], right: T[]): number {
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;
  let previous = new Array<number>(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) previous[j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    const current = new Array<number>(right.length + 1);
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    previous = current;
  }
  return previous[right.length] ?? 0;
}

function tokenSimilarity(left: string[], right: string[]): number {
  const longest = Math.max(left.length, right.length);
  if (longest === 0) return 1;
  return 1 - levenshteinDistance(left, right) / longest;
}

/**
 * Returns a 0..1 support score. Exact normalized containment is always 1.0.
 * Otherwise the best same-length token window is compared so padding in a
 * long source document cannot dilute a short quoted span.
 */
export function spanSupportScore(quotedSpan: string, sourceText: string): number {
  const quote = normalizeSpanText(quotedSpan);
  const source = normalizeSpanText(sourceText);
  if (quote.length === 0) return 0;
  if (source.length === 0) return 0;
  if (source.includes(quote)) return 1;

  const quoteTokens = tokenize(quote);
  const sourceTokens = tokenize(source);
  if (quoteTokens.length === 0 || sourceTokens.length === 0) return 0;

  const widths = new Set<number>([
    Math.max(1, quoteTokens.length - 1),
    quoteTokens.length,
    quoteTokens.length + 1,
  ]);
  let best = 0;
  for (const width of widths) {
    if (width > sourceTokens.length) {
      best = Math.max(best, tokenSimilarity(quoteTokens, sourceTokens));
      continue;
    }
    for (let start = 0; start + width <= sourceTokens.length; start += 1) {
      const score = tokenSimilarity(quoteTokens, sourceTokens.slice(start, start + width));
      if (score > best) best = score;
      if (best === 1) return best;
    }
  }
  return Math.max(0, Math.min(1, best));
}

export function verifySpan(
  quotedSpan: string,
  sourceText: string,
  fuzzyThreshold = FUZZY_SPAN_THRESHOLD,
): { supported: boolean; method: "exact" | "fuzzy" | "none"; score: number } {
  const quote = normalizeSpanText(quotedSpan);
  const source = normalizeSpanText(sourceText);
  if (quote.length > 0 && source.includes(quote)) {
    return { supported: true, method: "exact", score: 1 };
  }
  const score = spanSupportScore(quotedSpan, sourceText);
  if (score >= fuzzyThreshold) {
    return { supported: true, method: "fuzzy", score };
  }
  return { supported: false, method: "none", score };
}

function evidenceItems(prediction: GapPrediction): Array<{ doc_id: string; quoted_span: string }> {
  if (!Array.isArray(prediction.evidence)) return [];
  return prediction.evidence
    .map((item) => {
      if (typeof item === "string") return { doc_id: item, quoted_span: "" };
      if (!item || typeof item !== "object") return null;
      const record = item as unknown as Record<string, unknown>;
      const docId = record["doc_id"] ?? record["docId"] ?? record["source_doc_id"];
      const span = record["quoted_span"] ?? record["span"] ?? "";
      if (typeof docId !== "string" || docId.length === 0) return null;
      return { doc_id: docId, quoted_span: typeof span === "string" ? span : "" };
    })
    .filter((item): item is { doc_id: string; quoted_span: string } => item !== null);
}

export function evaluateGapGrounding(
  prediction: GapPrediction,
  records: SourceRecordLike[],
  options: GroundingOptions = {},
): GapGroundingResult {
  const byId = new Map(records.map((record) => [record.source_doc_id, record]));
  const items = evidenceItems(prediction);
  const failures = new Set<"EV-01" | "EV-02" | "EV-03">();
  const evidence: EvidenceGroundingResult[] = [];

  if (items.length === 0) failures.add("EV-01");

  for (const item of items) {
    const record = byId.get(item.doc_id);
    if (!record) {
      failures.add("EV-01");
      evidence.push({
        doc_id: item.doc_id,
        exists: false,
        owned_by_patient: false,
        span_supported: false,
        verification_method: "none",
        verification_score: 0,
      });
      continue;
    }

    const owned = record.patient_id === prediction.patient_id;
    if (!owned) failures.add("EV-02");

    let span: { supported: boolean; method: "exact" | "fuzzy" | "none"; score: number } = {
      supported: false,
      method: "none",
      score: 0,
    };
    if (item.quoted_span.trim().length > 0) {
      span = verifySpan(item.quoted_span, record.text, options.fuzzyThreshold);
    }
    if (!span.supported) failures.add("EV-03");

    evidence.push({
      doc_id: item.doc_id,
      exists: true,
      owned_by_patient: owned,
      span_supported: span.supported,
      verification_method: span.method,
      verification_score: span.score,
    });
  }

  return {
    prediction_id: prediction.prediction_id,
    patient_id: prediction.patient_id,
    grounded: failures.size === 0,
    evidence,
    failures: [...failures].sort() as Array<"EV-01" | "EV-02" | "EV-03">,
  };
}

export function evaluateGrounding(
  predictions: GapPrediction[],
  records: SourceRecordLike[],
  options: GroundingOptions = {},
): GroundingMetrics {
  const results = predictions.map((prediction) => evaluateGapGrounding(prediction, records, options));
  const evidenceItemsTotal = results.reduce((sum, result) => sum + result.evidence.length, 0);
  const citedAndValid = results.reduce(
    (sum, result) => sum + result.evidence.filter((item) => item.exists && item.owned_by_patient).length,
    0,
  );
  const spansSupported = results.reduce(
    (sum, result) => sum + result.evidence.filter((item) => item.span_supported).length,
    0,
  );
  const missingCitationPredictions = results.filter((result) => result.evidence.length === 0).length;
  const citationDenominator = evidenceItemsTotal + missingCitationPredictions;
  const grounded = results.filter((result) => result.grounded).length;

  const groundedRate = predictions.length === 0 ? null : grounded / predictions.length;
  return {
    reported_gaps: predictions.length,
    evidence_items: evidenceItemsTotal,
    citation_validity: citationDenominator === 0 ? null : citedAndValid / citationDenominator,
    span_support_rate:
      predictions.length === 0 ? null : citationDenominator === 0 ? 0 : spansSupported / citationDenominator,
    grounded_gap_rate: groundedRate,
    unsupported_claim_rate: groundedRate === null ? null : 1 - groundedRate,
    results,
  };
}

export function filterGroundedPredictions(
  predictions: GapPrediction[],
  records: SourceRecordLike[],
  options: GroundingOptions = {},
): { displayed: GapPrediction[]; suppressed: GapPrediction[]; results: GapGroundingResult[] } {
  const results = predictions.map((prediction) => evaluateGapGrounding(prediction, records, options));
  const displayed: GapPrediction[] = [];
  const suppressed: GapPrediction[] = [];
  for (const [index, prediction] of predictions.entries()) {
    const result = results[index];
    if (result?.grounded) displayed.push(prediction);
    else suppressed.push(prediction);
  }
  return { displayed, suppressed, results };
}
