import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CLAIMS } from "@/lib/claims/registry";

/**
 * Claim surface audit for the Phase-14 proof and impact surfaces.
 *
 * Two checks:
 * 1. Banned overstatement phrases (hard failure).
 * 2. Quantitative fragments that do not match a registry value (manual review
 *    list; the heuristic cannot distinguish layout constants from claims).
 */
const ROOTS = ["app/evaluation", "app/insights", "components/evaluation", "components/impact", "docs/impact"];
const EXTENSIONS = [".tsx", ".ts", ".md"];

const BANNED = [
  /\b95%\s*accur/i,
  /\bzero hallucinations?\b/i,
  /\b100%\s*accurate\b/i,
  /\bclinically validated\b/i,
  /\bstatistically significant\b/i,
  /\blives saved\b/i,
  /\bhallucination-free\b/i,
  /\bsaves? \d+ hours?\b/i,
];

function walk(dir: string, files: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) files.push(full);
  }
  return files;
}

const registryValues = new Set<string>();
for (const claim of CLAIMS) {
  if (claim.value !== null) registryValues.add(String(claim.value));
  // Human-readable forms of the same value.
  if (typeof claim.value === "number" && claim.unit === "rate") {
    registryValues.add(`${(claim.value * 100).toFixed(0)}%`);
  }
}
registryValues.add("3"); // three supported gap types (structural)

const pattern = /\b(\d{1,3}(?:\.\d+)?)\s?(%|ms|hours?|minutes?|gaps?|patients?)\b/g;

interface Finding {
  file: string;
  line: number;
  match: string;
  value: string;
  registered: boolean;
}

/** A phrase introduced as a prohibition ("never ...", "No surface says ...") is not an assertion. */
const NEGATION_CONTEXT = /\b(never|not|no|without|cannot|avoid|prohibit|banned)\b/i;

const findings: Finding[] = [];
const banned: Array<{ file: string; line: number; phrase: string }> = [];
const prohibitions: Array<{ file: string; line: number; phrase: string }> = [];

for (const root of ROOTS) {
  for (const file of walk(join(process.cwd(), root))) {
    const rel = relative(process.cwd(), file).replace(/\\/g, "/");
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((text, index) => {
      for (const rule of BANNED) {
        const hit = text.match(rule);
        if (!hit) continue;
        const entry = { file: rel, line: index + 1, phrase: hit[0] };
        const before = text.slice(0, hit.index ?? 0);
        if (NEGATION_CONTEXT.test(before)) prohibitions.push(entry);
        else banned.push(entry);
      }
      for (const match of text.matchAll(pattern)) {
        const value = match[1] ?? "";
        findings.push({
          file: rel,
          line: index + 1,
          match: match[0],
          value,
          registered: registryValues.has(value),
        });
      }
    });
  }
}

const unmatched = findings.filter((f) => !f.registered);

console.log("CONTINUA CLAIM SURFACE AUDIT");
console.log(`Surfaces: ${ROOTS.join(", ")}`);
console.log(`Quantitative fragments: ${findings.length}`);
console.log(`Matching a registry value: ${findings.length - unmatched.length}`);
console.log(`Needing manual review: ${unmatched.length}`);
for (const finding of unmatched) {
  console.log(`  ${finding.file}:${finding.line} "${finding.match}"`);
}
console.log(`Banned overstatement phrases: ${banned.length}`);
for (const hit of banned) console.log(`  ${hit.file}:${hit.line} "${hit.phrase}"`);
if (prohibitions.length > 0) {
  console.log(`Quoted as prohibitions (not assertions): ${prohibitions.length}`);
  for (const hit of prohibitions) console.log(`  ${hit.file}:${hit.line} "${hit.phrase}"`);
}
console.log("Status: " + (banned.length === 0 ? "PASS (no banned overstatement)" : "FAIL"));
if (banned.length > 0) process.exitCode = 1;
