import type { ExtractionEnvelope } from "./preprocess";

export const MAX_DOC_CHARS = 12000;

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  /** Character offset of this chunk within the original document text. */
  char_offset: number;
  text: string;
}

/**
 * One document per request unless it exceeds the input budget. Chunks split on
 * paragraph boundaries and carry offsets so spans map back to the original text.
 */
export function chunkDocument(envelope: ExtractionEnvelope, maxChars = MAX_DOC_CHARS): DocumentChunk[] {
  const { document_id, text } = envelope;
  if (text.length <= maxChars) {
    return [{ chunk_id: `${document_id}:0`, document_id, char_offset: 0, text }];
  }

  const chunks: DocumentChunk[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start) {
        end = paragraphBreak;
      } else {
        const lineBreak = text.lastIndexOf("\n", end);
        if (lineBreak > start) end = lineBreak;
      }
    }
    chunks.push({
      chunk_id: `${document_id}:${chunks.length}`,
      document_id,
      char_offset: start,
      text: text.slice(start, end),
    });
    start = end;
    while (start < text.length && text[start] === "\n") start += 1;
  }
  return chunks;
}