export { DISCLAIMER, SYNTHETIC_BANNER } from "@/lib/domain/api";

export interface ForbiddenTerm {
  label: string;
  pattern: RegExp;
}

export const FORBIDDEN_TERMS: ForbiddenTerm[] = [
  { label: "risk_level", pattern: /\brisk_level\b/i },
  { label: "clinical risk score", pattern: /clinical risk score/i },
  { label: "patient risk score", pattern: /patient risk score/i },
  { label: "clinically validated", pattern: /clinically validated/i },
  { label: "connects to Epic", pattern: /connects? to epic/i },
  { label: "orders medication", pattern: /orders? medication/i },
  { label: "recommends treatment", pattern: /recommends? treatment/i },
  { label: "prescribe", pattern: /\bprescrib(e|es|ed|ing)\b/i },
  { label: "HIPAA compliant", pattern: /hipaa[\s-]*compliant/i },
];

export interface Finding {
  line: number;
  label: string;
}

export function scanText(text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const term of FORBIDDEN_TERMS) {
      if (term.pattern.test(line)) {
        findings.push({ line: index + 1, label: term.label });
      }
    }
  }
  return findings;
}

export * from "./version";
export * from "./intended-use";
export * from "./prohibited-use";
export * from "./authority";
export * from "./action-language";
export * from "./data-classification";
export * from "./synthetic-only";
export * from "./output-guard";
export * from "./redaction";
export * from "./audit";
export * from "./incident";
export * from "./risk-register";
