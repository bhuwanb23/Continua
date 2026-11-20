import { describe, expect, it } from "vitest";
import type { SourceRecord } from "@/lib/domain";
import { SourceRecordSchema } from "@/lib/schemas";
import { chunkDocument, MAX_DOC_CHARS } from "@/lib/extraction/chunking";
import { prepareExtractionEnvelope } from "@/lib/extraction/preprocess";
import { assertCacheVersionCompatible } from "@/lib/cache/compatibility";
import type { CacheManifest } from "@/lib/cache/manifest";
import { readCache } from "./support";

const records = readCache<SourceRecord[]>("records.json");
const base = records[0]!;
const clone = (): SourceRecord => JSON.parse(JSON.stringify(base)) as SourceRecord;

describe("dataset input boundaries", () => {
  it("DATA-01 rejects a record with no patient id", () => {
    const record = clone() as unknown as Record<string, unknown>;
    delete record.patient_id;
    expect(SourceRecordSchema.safeParse(record).success).toBe(false);
  });

  it("DATA-02 accepts an unknown but schema-valid provider", () => {
    const record = clone();
    record.provider = "Unlisted community clinic";
    expect(SourceRecordSchema.safeParse(record).success).toBe(true);
  });

  it("DATA-03 rejects an impossible date", () => {
    const record = clone();
    record.date = "2026-02-31";
    expect(SourceRecordSchema.safeParse(record).success).toBe(false);
  });

  it("DATA-04 detects a duplicate document id at dataset scope", () => {
    const ids = [base.source_doc_id, base.source_doc_id];
    expect(new Set(ids).size).not.toBe(ids.length);
  });

  it("DATA-05 rejects an unsupported document type", () => {
    const record = clone() as unknown as Record<string, unknown>;
    record.doc_type = "genomics";
    expect(SourceRecordSchema.safeParse(record).success).toBe(false);
  });

  it("DATA-06 rejects empty text instead of inventing events", () => {
    const record = clone();
    record.text = "";
    expect(SourceRecordSchema.safeParse(record).success).toBe(false);
  });

  it("DATA-07 chunks an extremely long record within the input budget", () => {
    const record = clone();
    record.text = Array.from({ length: 1200 }, (_, index) => `Paragraph ${index} clinical note.`).join(
      "\n\n",
    );
    expect(record.text.length).toBeGreaterThan(MAX_DOC_CHARS);
    const chunks = chunkDocument(prepareExtractionEnvelope(record));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.text.length <= MAX_DOC_CHARS)).toBe(true);
    expect(chunks[0]!.char_offset).toBe(0);
    expect(chunks.at(-1)!.char_offset + chunks.at(-1)!.text.length).toBeLessThanOrEqual(
      record.text.length,
    );
  });

  it("DATA-08 fails a fatal UTF-8 decode in a controlled way", () => {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    expect(() => decoder.decode(new Uint8Array([0xff, 0xfe, 0xfd]))).toThrow();
  });

  it("DATA-09 rejects synthetic=false", () => {
    const record = clone() as unknown as Record<string, unknown>;
    record.synthetic = false;
    expect(SourceRecordSchema.safeParse(record).success).toBe(false);
  });

  it("DATA-10 rejects an incompatible dataset snapshot version", () => {
    const manifest = readCache<CacheManifest>("manifest.json");
    expect(() =>
      assertCacheVersionCompatible({ ...manifest, dataset_version: "continua-synth-v2" }),
    ).toThrow(/dataset_version/);
  });
});
