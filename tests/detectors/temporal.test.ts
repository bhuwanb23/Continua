import { describe, expect, it } from "vitest";
import { addDays, classifyTemporalState, daysBetween, dueDate, isIsoDate, overdueDays } from "@/lib/detectors/common/dates";

describe("detector temporal engine", () => {
  it("handles month boundaries and 30/31-day months", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-31", 1)).toBe("2026-04-01");
    expect(addDays("2026-04-30", 1)).toBe("2026-05-01");
    expect(addDays("2026-05-31", 1)).toBe("2026-06-01");
  });

  it("handles leap year and end of February", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2025-02-29")).toBe(false);
  });

  it("uses calendar-day arithmetic with no off-by-one drift", () => {
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(dueDate("2026-03-25", 45)).toBe("2026-05-09");
    expect(overdueDays("2026-05-09", "2026-06-05")).toBe(27);
  });

  it("clamps overdue days at zero", () => {
    expect(overdueDays("2026-06-10", "2026-06-05")).toBe(0);
  });

  it("classifies OPEN, DUE_SOON, OVERDUE, and RESOLVED", () => {
    expect(classifyTemporalState("2026-07-01", "2026-06-05")).toBe("OPEN");
    expect(classifyTemporalState("2026-06-10", "2026-06-05")).toBe("DUE_SOON");
    expect(classifyTemporalState("2026-06-04", "2026-06-05")).toBe("OVERDUE");
    expect(classifyTemporalState("2026-06-04", "2026-06-05", true)).toBe("RESOLVED");
  });
});
