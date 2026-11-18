import { normalizeSpan } from "@/lib/evidence/span-match";

interface NormalizedText {
  normalized: string;
  /** normalized index → raw index of the first raw character producing it. */
  map: number[];
}

function normalizedWithMap(text: string): NormalizedText {
  const stage1: string[] = [];
  const stage1Map: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] ?? "";
    if (char === "\r") {
      stage1.push("\n");
      stage1Map.push(i);
      if (text[i + 1] === "\n") i += 1;
    } else if (char === "\u2018" || char === "\u2019") {
      stage1.push("'");
      stage1Map.push(i);
    } else if (char === "\u201C" || char === "\u201D") {
      stage1.push('"');
      stage1Map.push(i);
    } else {
      stage1.push(char);
      stage1Map.push(i);
    }
  }

  let normalized = "";
  const map: number[] = [];
  let whitespaceStart: number | null = null;
  for (let i = 0; i < stage1.length; i += 1) {
    const char = stage1[i] ?? "";
    if (/\s/.test(char)) {
      if (whitespaceStart === null) whitespaceStart = stage1Map[i] ?? i;
      continue;
    }
    if (whitespaceStart !== null && normalized.length > 0) {
      normalized += " ";
      map.push(whitespaceStart);
    }
    whitespaceStart = null;
    const lower = char.toLowerCase();
    for (const piece of lower) {
      normalized += piece;
      map.push(stage1Map[i] ?? i);
    }
  }
  return { normalized, map };
}

/**
 * Locate a span's character offsets server-side. Exact raw containment first,
 * then formatting-normalized containment mapped back to raw offsets. Fuzzy
 * matches have no unambiguous location and return undefined.
 */
export function locateSpanOffsets(
  span: string,
  text: string,
): { span_start: number; span_end: number } | undefined {
  if (span.length === 0) return undefined;
  const rawIndex = text.indexOf(span);
  if (rawIndex >= 0) {
    return { span_start: rawIndex, span_end: rawIndex + span.length };
  }
  const normalizedSpan = normalizeSpan(span);
  if (normalizedSpan.length === 0) return undefined;
  const { normalized, map } = normalizedWithMap(text);
  const index = normalized.indexOf(normalizedSpan);
  if (index < 0) return undefined;
  const start = map[index];
  const last = map[index + normalizedSpan.length - 1];
  if (start === undefined || last === undefined) return undefined;
  return { span_start: start, span_end: last + 1 };
}