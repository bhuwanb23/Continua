import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const roots = ["app", "components", "lib", "scripts"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".json"]);

/**
 * This test deliberately constructs a fake secret to prove it never reaches
 * the public config projection.
 */
const allowlist = new Set(["tests/unit/env.test.ts", "scripts/check-secrets.ts"]);

const patterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "openai-style key", pattern: /\bsk-[A-Za-z0-9_-]{12,}\b/ },
  { label: "bearer token", pattern: /\bBearer\s+[A-Za-z0-9._-]{12,}\b/ },
  {
    label: "hardcoded credential assignment",
    pattern: /\b(api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{6,}["']/i,
  },
  { label: "MRN identifier", pattern: /\bMRN\b/ },
  { label: "SSN identifier", pattern: /\bSSN\b/ },
];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (extensions.has(full.slice(full.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];

const files = roots.flatMap((base) => walk(join(root, base)));
for (const file of [...files, join(root, ".env.example")]) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (allowlist.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    // Empty template values are expected.
    if (/^\s*[A-Z0-9_]+=\s*$/.test(line)) continue;
    if (line.includes("safety-allow")) continue;
    for (const candidate of patterns) {
      if (candidate.pattern.test(line)) {
        violations.push(`${rel}:${index + 1} — ${candidate.label}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Secret scan failed:");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log("Secret scan passed: no credential-like strings in tracked code.");
