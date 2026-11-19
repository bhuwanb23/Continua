import { describe, expect, it } from "vitest";
import { duplicateTestGapId, medicationMonitoringGapId, missedFollowupGapId } from "@/lib/detectors/common/ids";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("stable candidate gap identities", () => {
  it("returns the same ID for the same identity inputs", () => {
    expect(missedFollowupGapId("patient", "referral", "oncology")).toBe(
      missedFollowupGapId("patient", "referral", "oncology"),
    );
    expect(duplicateTestGapId("patient", "lab:cbc", "event-1")).toBe(
      duplicateTestGapId("patient", "lab:cbc", "event-1"),
    );
    expect(medicationMonitoringGapId("patient", "start", "inr")).toBe(
      medicationMonitoringGapId("patient", "start", "inr"),
    );
  });

  it("changes when an occurrence input changes", () => {
    expect(missedFollowupGapId("patient", "referral-1", "oncology")).not.toBe(
      missedFollowupGapId("patient", "referral-2", "oncology"),
    );
    expect(duplicateTestGapId("patient", "lab:cbc", "event-1")).not.toBe(
      duplicateTestGapId("patient", "lab:cbc", "event-2"),
    );
    expect(medicationMonitoringGapId("patient", "start", "inr")).not.toBe(
      medicationMonitoringGapId("patient", "start", "a1c"),
    );
  });

  it("emits UUID-shaped deterministic IDs and keeps gap types separate", () => {
    const followup = missedFollowupGapId("patient", "same-event", "oncology");
    const duplicate = duplicateTestGapId("patient", "same-event", "medication");
    expect(followup).toMatch(UUID);
    expect(duplicate).toMatch(UUID);
    expect(followup).not.toBe(duplicate);
  });
});
