import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALLOWED_OUTPUT_LABELS } from "@/lib/safety/action-language";
import { HUMAN_OVERSIGHT } from "@/lib/safety/authority";
import { auditAccessibility } from "../../scripts/lib/safety-audits";

const ROOT = process.cwd();

function source(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

describe("accessibility and human oversight", () => {
  it("passes the static accessibility audit", () => {
    const audit = auditAccessibility();
    expect(audit.issues).toEqual([]);
    expect(audit.checked).toBeGreaterThanOrEqual(7);
  });

  it("labels every synthetic, priority, evidence, and disclaimer surface in text", () => {
    expect(ALLOWED_OUTPUT_LABELS.synthetic).toMatch(/Synthetic/);
    expect(ALLOWED_OUTPUT_LABELS.priority).toMatch(/Workflow priority/);
    expect(ALLOWED_OUTPUT_LABELS.evidence_drawer).toMatch(/records/i);
    for (const value of Object.values(ALLOWED_OUTPUT_LABELS)) {
      expect(value.length).toBeGreaterThan(5);
      expect(value).not.toMatch(/high[- ]risk|risk score|urgent|critical/i);
    }
    expect(source("components/queue/PriorityBadge.tsx")).toContain("{band} · {label}");
    expect(source("components/layout/SyntheticDataBanner.tsx")).toContain("role=\"note\"");
  });

  it("provides keyboard-operable evidence disclosure", () => {
    const drawer = source("app/patients/[patientId]/page.tsx");
    expect(drawer).toContain("aria-expanded");
    expect(drawer).toContain("aria-controls");
    expect(drawer).toContain("role=\"dialog\"");
    expect(drawer).toContain("aria-modal=\"true\"");
    expect(drawer).toMatch(/focus-visible:outline/);
    expect(drawer).toMatch(/onKeyDown/);
  });

  it("publishes a human-oversight contract on every surfaced gap", () => {
    expect(HUMAN_OVERSIGHT.requirement).toMatch(/human/i);
    expect(HUMAN_OVERSIGHT.prohibited_actions.join(" ")).toMatch(/contact|order|prescribe/i);
    expect(source("components/queue/QueueCard.tsx")).toMatch(/SafetyNote/);
    expect(source("components/safety/SafetyNote.tsx")).toContain("ALLOWED_OUTPUT_LABELS");
  });

  it("does not encode priority by color alone", () => {
    const badge = source("components/queue/PriorityBadge.tsx");
    expect(badge).toMatch(/\{label\}/);
    expect(badge).not.toMatch(/aria-hidden/);
  });
});
