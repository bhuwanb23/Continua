export const FUZZY_SPAN_THRESHOLD = 0.85;

export function normalizeSpan(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function levenshtein(left: string[], right: string[]): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0] ?? 0;
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j] ?? 0;
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      previous[j] = Math.min((previous[j - 1] ?? 0) + 1, above + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return previous[right.length] ?? left.length;
}

function characterDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0] ?? 0;
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j] ?? 0;
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      previous[j] = Math.min((previous[j - 1] ?? 0) + 1, above + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return previous[right.length] ?? left.length;
}

export function spanSupportScore(quotedSpan: string, sourceText: string): number {
  const quote = normalizeSpan(quotedSpan);
  const source = normalizeSpan(sourceText);
  if (!quote || !source) return 0;
  if (source.includes(quote)) return 1;
  const quoteTokens = quote.split(/[^a-z0-9%./-]+/).filter(Boolean);
  const sourceTokens = source.split(/[^a-z0-9%./-]+/).filter(Boolean);
  if (quoteTokens.length === 0 || sourceTokens.length === 0) return 0;
  const widths = new Set([Math.max(1, quoteTokens.length - 1), quoteTokens.length, quoteTokens.length + 1]);
  let best = 0;
  for (const width of widths) {
    for (let start = 0; start + width <= sourceTokens.length; start += 1) {
      const window = sourceTokens.slice(start, start + width);
      const denominator = Math.max(quoteTokens.length, window.length);
      const tokenScore = 1 - levenshtein(quoteTokens, window) / denominator;
      const quoteText = quoteTokens.join(" ");
      const windowText = window.join(" ");
      const characterScore =
        1 - characterDistance(quoteText, windowText) / Math.max(quoteText.length, windowText.length);
      best = Math.max(best, tokenScore, characterScore);
    }
  }
  return Math.max(0, Math.min(1, best));
}

export function verifySourceSpan(
  quotedSpan: string,
  sourceText: string,
  threshold = FUZZY_SPAN_THRESHOLD,
): { supported: boolean; method: "exact" | "fuzzy" | "none"; score: number } {
  const exactQuote = normalizeSpan(quotedSpan);
  const normalizedSource = normalizeSpan(sourceText);
  if (exactQuote.length > 0 && normalizedSource.includes(exactQuote)) {
    return { supported: true, method: "exact", score: 1 };
  }
  const score = spanSupportScore(quotedSpan, sourceText);
  return score >= threshold
    ? { supported: true, method: "fuzzy", score }
    : { supported: false, method: "none", score };
}
