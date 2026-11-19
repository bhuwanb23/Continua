import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) output.push(...sourceFiles(path));
    else if (path.endsWith(".ts")) output.push(path);
  }
  return output;
}

const files = sourceFiles(join(process.cwd(), "lib", "detectors"));
const source = files.map((path) => readFileSync(path, "utf8")).join("\n");

describe("detector leakage and purity gates", () => {
  it("has detector source files to scan", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("does not import labels, generator truth, fixtures, or model clients", () => {
    const forbidden = [
      "@/lib/generator",
      "ground_truth",
      "negative_manifest",
      "truth-events",
      "fixture_key",
      "P-001-maria",
      "OPENAI",
      "ANTHROPIC",
      "createLlmProvider",
      "LlmDocumentExtractor",
    ];
    for (const token of forbidden) expect(source).not.toContain(token);
  });

  it("does not read the wall clock or use randomness or network calls", () => {
    for (const token of ["new Date(", "Date.now(", "Math.random", "fetch(", "XMLHttpRequest"]) {
      expect(source).not.toContain(token);
    }
  });

  it("does not inspect raw document text", () => {
    expect(source).not.toContain(".text");
    expect(source).not.toContain("records.json");
    expect(source).not.toContain("source_text");
  });
});
