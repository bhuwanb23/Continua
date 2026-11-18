import { describe, expect, it } from "vitest";
import { duplicateWindowFor } from "@/lib/policies/duplicate-windows";
import { monitoringPolicyFor } from "@/lib/policies/monitoring-policy";
import { referralWindowFor } from "@/lib/policies/referral-windows";
import { canonicalEvent } from "../support/clinical-events";

describe("ClinicalEvent detector sufficiency boundary", () => {
  it("exposes referral completion inputs without requiring description parsing", () => {
    const event = canonicalEvent();
    expect(event.typed).toMatchObject({
      specialty_normalized: "oncology",
      expected_window_days: 45,
      status: "placed",
    });
    expect(referralWindowFor("oncology")).toBe(45);
  });

  it("keeps duplicate and monitoring policy inputs outside the event payload", () => {
    const event = canonicalEvent();
    expect(event.typed).not.toHaveProperty("duplicate_window_days");
    expect(event.typed).not.toHaveProperty("monitoring_targets");
    expect(duplicateWindowFor("lab_result")).toBeGreaterThan(0);
    expect(monitoringPolicyFor("metformin")?.targets).toContain("a1c");
  });
});
