import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FixtureClinicalEventExtractor } from "@/lib/extraction/clinical-event-extractor";
import { FixtureSchema } from "@/lib/schemas";
import { EXTRACTOR_VERSION } from "@/lib/domain/versions";

const raw = JSON.parse(
  readFileSync(join(process.cwd(), "data", "fixtures", "maria-minimal.json"), "utf8"),
) as unknown;

const fixture = FixtureSchema.parse(raw);

describe("fixture extraction boundary", () => {
  it("extracts events from synthetic records with no network call", async () => {
    const extractor = new FixtureClinicalEventExtractor({
      events: fixture.events,
      extraction_confidence: 0.95,
      extractor_version: EXTRACTOR_VERSION,
    });

    const result = await extractor.extract({ records: fixture.records });

    expect(result.events).toHaveLength(2);
    expect(result.extractor_version).toBe("extractor-v1");
  });

  it("keeps the extractor version on the interface", () => {
    const extractor = new FixtureClinicalEventExtractor({
      events: [],
      extraction_confidence: 1,
      extractor_version: EXTRACTOR_VERSION,
    });
    expect(extractor.version).toBe("extractor-v1");
  });
});
