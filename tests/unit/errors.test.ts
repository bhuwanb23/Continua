import { describe, expect, it } from "vitest";
import {
  NotFoundError,
  PipelineError,
  ValidationError,
} from "@/lib/errors";
import { ApiErrorSchema } from "@/lib/schemas";

describe("T5 API error contract", () => {
  it("maps an unknown patient to a structured 404", () => {
    const error = new NotFoundError("Patient not found.", {
      code: "patient_not_found",
    });
    expect(error.status).toBe(404);
    expect(ApiErrorSchema.safeParse(error.toEnvelope()).success).toBe(true);
  });

  it("maps an unknown gap to its own code", () => {
    const error = new NotFoundError("Gap not found.", { code: "gap_not_found" });
    expect(error.toEnvelope()).toEqual({
      error: { code: "gap_not_found", message: "Gap not found." },
    });
  });

  it("maps validation failures to 400", () => {
    const error = new ValidationError("Invalid payload.");
    expect(error.status).toBe(400);
    expect(error.code).toBe("invalid_payload");
  });

  it("never exposes a stack trace in the envelope", () => {
    const error = new PipelineError("Extraction failed.");
    const serialized = JSON.stringify(error.toEnvelope());
    expect(serialized).not.toContain("at ");
    expect(serialized).not.toContain("stack");
  });
});
