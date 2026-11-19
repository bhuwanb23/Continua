import { z } from "zod";
import { GapTypeSchema, PriorityBandSchema } from "./dto";

const UUID = z.string().uuid();

export const PanelParamsSchema = z.object({
  panelId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,31}$/),
});

export const PatientParamsSchema = z.object({ patientId: UUID });

export const GapParamsSchema = z.object({ gapId: UUID });

/** Accepts numeric strings, rejects non-numeric input, clamps out-of-range values. */
function clampedInt(min: number, max: number, fallback: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return value;
    return Math.min(max, Math.max(min, Math.trunc(parsed)));
  }, z.number().int().min(min).max(max));
}

export const PATIENT_SORTS = ["priority", "name", "last_contact"] as const;

export const PatientListQuerySchema = z.object({
  query: z.string().trim().max(100).optional(),
  gap_type: GapTypeSchema.optional(),
  priority_band: PriorityBandSchema.optional(),
  limit: clampedInt(1, 100, 50),
  offset: clampedInt(0, 10_000, 0),
  sort: z.enum(PATIENT_SORTS).default("priority"),
});

export const QueueQuerySchema = z.object({
  k: clampedInt(1, 80, 5),
});

export const MetricsQuerySchema = z.object({
  panelId: PanelParamsSchema.shape.panelId.default("demo"),
});

export type PatientListQuery = z.infer<typeof PatientListQuerySchema>;
export type QueueQuery = z.infer<typeof QueueQuerySchema>;
