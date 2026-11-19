import { normalizeSpan, spanSupportScore } from "@/lib/evidence/span-match";
import { locateSpanOffsets } from "@/lib/provenance";
import type { EvidenceFailure } from "./internal-types";
import { FUZZY_MIN_SPAN_CHARS, FUZZY_MIN_SPAN_TOKENS } from "./version";

export const EVIDENCE_FUZZY_THRESHOLD = 0.85;

export interface SpanVerification {
  supported: boolean;
  method: "exact" | "fuzzy" | "none";
  score: number;
  span_start?: number;
  span_end?: number;
  failure?: EvidenceFailure;
}

function tokenCount(value: string): number {
  return value.split(/[^a-z0-9%./-]+/).filter(Boolean).length;
}

export function verifyEvidenceSpan(quotedSpan: string, sourceText: string): SpanVerification {
  const quote = normalizeSpan(quotedSpan);
  const source = normalizeSpan(sourceText);
  if (quote.length === 0) {
    return {
      supported: false,
      method: "none",
      score: 0,
      failure: {
        code: "EV-004",
        stage: "span",
        message: "Quoted evidence span is empty.",
      },
    };
  }

  const offsets = locateSpanOffsets(quotedSpan, sourceText);
  if (source.includes(quote)) {
    return {
      supported: true,
      method: "exact",
      score: 1,
      ...(offsets ?? {}),
    };
  }

  const quoteTokens = tokenCount(quote);
  if (quote.length < FUZZY_MIN_SPAN_CHARS || quoteTokens < FUZZY_MIN_SPAN_TOKENS) {
    return {
      supported: false,
      method: "none",
      score: spanSupportScore(quotedSpan, sourceText),
      failure: {
        code: "EV-004",
        stage: "span",
        message: "Quoted span is too short and non-specific for bounded fuzzy support.",
      },
    };
  }

  const score = spanSupportScore(quotedSpan, sourceText);
  if (score >= EVIDENCE_FUZZY_THRESHOLD) {
    return {
      supported: true,
      method: "fuzzy",
      score,
      ...(offsets ?? {}),
    };
  }
  return {
    supported: false,
    method: "none",
    score,
    failure: {
      code: "EV-004",
      stage: "span",
      message: `Quoted span is not supported by the source text (score ${score.toFixed(3)}).`,
    },
  };
}

export function offsetsMatchQuote(
  text: string,
  spanStart: number | undefined,
  spanEnd: number | undefined,
  quotedSpan: string,
): boolean {
  if (spanStart === undefined || spanEnd === undefined) return true;
  if (spanEnd < spanStart || spanEnd > text.length) return false;
  const slice = text.slice(spanStart, spanEnd);
  return normalizeSpan(slice) === normalizeSpan(quotedSpan);
}
