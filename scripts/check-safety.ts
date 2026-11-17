import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { scanText } from "@/lib/safety";

const root = process.cwd();
const roots = ["app", "components", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx"]);

/** The scanner's own pattern table necessarily contains the terms it flags. */
const allowlist = new Set(["lib/safety/index.ts"]);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walk(full));
    } else if (extensions.has(full.slice(full.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];

for (const base of roots) {
  for (const file of walk(join(root, base))) {
    const rel = relative(root, file).replaceAll("\\", "/");
    if (allowlist.has(rel)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      // Explicit documentation of what the system does NOT do may opt out.
      if (line.includes("safety-allow")) continue;
      for (const finding of scanText(line)) {
        violations.push(`${rel}:${index + 1} — ${finding.label}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Safety check failed. Prohibited terms found:");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log("Safety check passed: no prohibited claims in product code.");
