import { describe, expect, it } from "vitest";
import {
  normalizeBodyRegion,
  normalizeImagingModality,
  normalizeLab,
  normalizeMedication,
  normalizeSpecialty,
} from "@/lib/normalization";

describe("normalization-v1", () => {
  it("maps the frozen lab aliases", () => {
    expect(normalizeLab("CBC")).toBe("cbc");
    expect(normalizeLab("Complete Blood Count")).toBe("cbc");
    expect(normalizeLab("CBC w/ diff")).toBe("cbc");
    expect(normalizeLab("HbA1c")).toBe("a1c");
    expect(normalizeLab("Thyroid Stimulating Hormone")).toBe("tsh");
    expect(normalizeLab("not a lab")).toBeNull();
  });

  it("maps medication, specialty, imaging, and region aliases", () => {
    expect(normalizeMedication("Metformin 500 mg twice daily")).toBe("metformin");
    expect(normalizeMedication("Coumadin")).toBe("warfarin");
    expect(normalizeSpecialty("Med Onc")).toBe("oncology");
    expect(normalizeSpecialty("PCP")).toBe("primary_care");
    expect(normalizeImagingModality("MRI")).toBe("mri");
    expect(normalizeBodyRegion("left breast")).toBe("breast");
    expect(normalizeBodyRegion("unknown organ")).toBe("unknown organ");
  });
});
