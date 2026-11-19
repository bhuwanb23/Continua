const SECRET_KEY = /(key|secret|token|password|authorization|credential)/i;

const CONTENT_PATTERNS: Array<{ label: string; pattern: RegExp; replacement: string }> = [
  { label: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[REDACTED-SSN]" },
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[REDACTED-EMAIL]" },
  { label: "phone", pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: "[REDACTED-PHONE]" },
  { label: "mrn", pattern: /\bMRN[-:\s]?\d{4,}\b/gi, replacement: "[REDACTED-MRN]" },
  { label: "dob", pattern: /\bDOB[:\s]+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi, replacement: "[REDACTED-DOB]" },
];

export function redactText(value: string): string {
  let output = value;
  for (const entry of CONTENT_PATTERNS) {
    output = output.replace(entry.pattern, entry.replacement);
  }
  return output;
}

export function redactValue(value: unknown, key?: string): unknown {
  if (key && SECRET_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [name, inner] of Object.entries(value as Record<string, unknown>)) {
      output[name] = redactValue(inner, name);
    }
    return output;
  }
  return value;
}

export function redactFields(fields: Record<string, unknown>): Record<string, unknown> {
  return redactValue(fields) as Record<string, unknown>;
}

export function isSensitiveKey(key: string): boolean {
  return SECRET_KEY.test(key);
}
