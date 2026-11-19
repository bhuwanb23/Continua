/**
 * continua-api-v1 OpenAPI 3.1 document. Kept in code so the freeze script can
 * compare it with the route tree and fail when a route is added undocumented.
 */

const META = {
  type: "object",
  required: ["api_version", "synthetic", "evaluation_as_of_date", "request_id"],
  properties: {
    api_version: { type: "string", enum: ["v1"] },
    synthetic: { type: "boolean", enum: [true] },
    evaluation_as_of_date: { type: "string", format: "date" },
    request_id: { type: "string" },
  },
} as const;

const DISCLAIMER = {
  type: "string",
  enum: ["Synthetic demo data. For coordinator verification only. Not medical advice."],
} as const;

const ERROR = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "request_id"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        request_id: { type: "string" },
      },
    },
  },
} as const;

const PRIORITY_BAND = { type: "string", enum: ["P1", "P2", "P3", "P4", "NONE"] } as const;
const PRIORITY_LABEL = {
  type: "string",
  enum: ["Act first", "Act soon", "Routine", "Monitor", "No verified gap"],
} as const;
const GAP_TYPE = {
  type: "string",
  enum: ["missed_followup", "duplicate_test", "med_monitoring"],
} as const;

const errorResponses = {
  "400": { description: "invalid_request / invalid_query", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  "404": { description: "entity not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  "500": { description: "data_integrity_error / internal_error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
  "503": { description: "demo_cache_not_ready", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
} as const;

function ok(schema: string, description: string) {
  return { "200": { description, content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } } };
}

export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    info: {
      title: "Continua API",
      version: "v1",
      description:
        "Read-only coordination intelligence over the frozen continua-demo-cache-v1 snapshot. Synthetic data only. " +
        "No endpoint exposes benchmark ground truth, candidate gaps, model internals, or clinical risk scores.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "panel" },
      { name: "patients" },
      { name: "evidence" },
      { name: "benchmark" },
      { name: "operations" },
    ],
    paths: {
      "/api/v1/panels/{panelId}": {
        get: {
          tags: ["panel"],
          summary: "Panel overview",
          parameters: [{ name: "panelId", in: "path", required: true, schema: { type: "string", pattern: "^[a-z0-9][a-z0-9-]{0,31}$" } }],
          responses: { ...ok("PanelResponse", "Panel aggregates"), ...errorResponses },
        },
      },
      "/api/v1/panels/{panelId}/patients": {
        get: {
          tags: ["patients"],
          summary: "Patient list with search, filters, and clamped pagination",
          parameters: [
            { name: "panelId", in: "path", required: true, schema: { type: "string" } },
            { name: "query", in: "query", schema: { type: "string", maxLength: 100 }, description: "Case-insensitive display-name substring." },
            { name: "gap_type", in: "query", schema: GAP_TYPE },
            { name: "priority_band", in: "query", schema: PRIORITY_BAND },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["priority", "name", "last_contact"] } },
          ],
          responses: { ...ok("PatientListResponse", "Patient page"), ...errorResponses },
        },
      },
      "/api/v1/panels/{panelId}/queue": {
        get: {
          tags: ["panel"],
          summary: "Frozen top-K intervention queue",
          parameters: [
            { name: "panelId", in: "path", required: true, schema: { type: "string" } },
            { name: "k", in: "query", schema: { type: "integer", minimum: 1, maximum: 80, default: 5 } },
          ],
          responses: { ...ok("QueueResponse", "Queue slice in stored order"), ...errorResponses },
        },
      },
      "/api/v1/patients/{patientId}": {
        get: {
          tags: ["patients"],
          summary: "Patient detail with priority breakdown",
          parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { ...ok("PatientResponse", "Patient summary"), ...errorResponses },
        },
      },
      "/api/v1/patients/{patientId}/timeline": {
        get: {
          tags: ["patients"],
          summary: "Canonical clinical timeline in ascending frozen order",
          parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { ...ok("TimelineResponse", "Timeline events"), ...errorResponses },
        },
      },
      "/api/v1/patients/{patientId}/gaps": {
        get: {
          tags: ["patients"],
          summary: "Verified gaps only, highest stored priority first",
          parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { ...ok("GapsResponse", "Verified gaps"), ...errorResponses },
        },
      },
      "/api/v1/evidence/{gapId}": {
        get: {
          tags: ["evidence"],
          summary: "Evidence trust deep-dive for one verified gap",
          parameters: [{ name: "gapId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { ...ok("EvidenceResponse", "Claims, sources, absence and policy checks"), ...errorResponses },
        },
      },
      "/api/v1/metrics": {
        get: {
          tags: ["benchmark"],
          summary: "Impact metrics bucketed by claim classification",
          parameters: [{ name: "panelId", in: "query", schema: { type: "string", default: "demo" } }],
          responses: { ...ok("MetricsResponse", "Measured, modeled, assumed, and external metrics"), ...errorResponses },
        },
      },
      "/api/v1/evaluation": {
        get: {
          tags: ["benchmark"],
          summary: "Frozen Phase-9 benchmark aggregates",
          responses: { ...ok("EvaluationResponse", "Benchmark evaluation"), ...errorResponses },
        },
      },
      "/api/v1/health": {
        get: { tags: ["operations"], summary: "Process liveness", responses: { ...ok("HealthResponse", "Process alive") } },
      },
      "/api/v1/readiness": {
        get: {
          tags: ["operations"],
          summary: "Validated demo cache availability",
          responses: { ...ok("ReadinessResponse", "Ready"), 503: errorResponses["503"] },
        },
      },
      "/api/v1/gaps/{gapId}/actions": {
        post: {
          tags: ["patients"],
          summary: "Record coordinator workflow state (intelligence unchanged)",
          parameters: [{ name: "gapId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["action"],
                  properties: { action: { type: "string", enum: ["acknowledged", "contacted", "reviewed"] } },
                },
              },
            },
          },
          responses: {
            ...ok("ActionResponse", "Action recorded"),
            400: errorResponses["400"],
            404: errorResponses["404"],
            422: { description: "unsupported_action", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            503: errorResponses["503"],
          },
        },
      },
    },
    components: {
      schemas: {
        Error: ERROR,
        PanelResponse: {
          type: "object",
          required: ["panel", "meta", "disclaimer"],
          properties: {
            panel: {
              type: "object",
              properties: {
                panel_id: { type: "string" },
                name: { type: "string" },
                patient_count: { type: "integer" },
                patients_with_verified_gaps: { type: "integer" },
                verified_gap_counts: { type: "object", additionalProperties: { type: "integer" } },
              },
            },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        PatientListResponse: {
          type: "object",
          required: ["panel_id", "patients", "total", "limit", "offset", "meta", "disclaimer"],
          properties: {
            panel_id: { type: "string" },
            total: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
            patients: { type: "array", items: { $ref: "#/components/schemas/PatientSummary" } },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        PatientSummary: {
          type: "object",
          properties: {
            patient_id: { type: "string", format: "uuid" },
            display_name: { type: "string" },
            age: { type: "integer" },
            sex: { type: "string", enum: ["F", "M", "X"] },
            primary_condition: { type: "string" },
            last_contact_date: { type: "string", format: "date" },
            verified_gap_count: { type: "integer" },
            patient_priority_score: { type: "integer", minimum: 0, maximum: 100 },
            priority_band: PRIORITY_BAND,
            priority_label: PRIORITY_LABEL,
            top_gap_type: { ...GAP_TYPE, nullable: true },
          },
        },
        PatientResponse: {
          type: "object",
          required: ["patient", "meta", "disclaimer"],
          properties: {
            patient: {
              allOf: [
                { $ref: "#/components/schemas/PatientSummary" },
                {
                  type: "object",
                  properties: {
                    priority_rank: { type: ["integer", "null"] },
                    priority_breakdown: { type: ["object", "null"], additionalProperties: true },
                  },
                },
              ],
            },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        TimelineResponse: {
          type: "object",
          required: ["patient_id", "events", "meta", "disclaimer"],
          properties: {
            patient_id: { type: "string", format: "uuid" },
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event_id: { type: "string" },
                  date: { type: "string", format: "date" },
                  date_precision: { type: "string" },
                  event_type: { type: "string" },
                  description: { type: "string" },
                  provider: { type: ["string", "null"] },
                  provider_type: { type: ["string", "null"] },
                  source_doc_id: { type: "string" },
                  display: { type: "object", additionalProperties: true },
                },
              },
            },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        GapsResponse: {
          type: "object",
          required: ["patient_id", "gaps", "meta", "disclaimer"],
          properties: {
            patient_id: { type: "string", format: "uuid" },
            gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  gap_id: { type: "string", format: "uuid" },
                  gap_type: GAP_TYPE,
                  title: { type: "string" },
                  workflow_severity: { type: "string", enum: ["low", "medium", "high"] },
                  gap_priority_score: { type: "integer", minimum: 0, maximum: 100 },
                  priority_band: PRIORITY_BAND,
                  priority_label: PRIORITY_LABEL,
                  summary: { type: "string" },
                  recommended_coordinator_action: { type: "string" },
                  evidence_status: { type: "string", enum: ["verified"] },
                  evidence_count: { type: "integer" },
                },
              },
            },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        EvidenceResponse: {
          type: "object",
          required: ["gap_id", "verification_status", "claims", "sources", "absence_checks", "policy_checks", "meta", "disclaimer"],
          properties: {
            gap_id: { type: "string", format: "uuid" },
            verification_status: { type: "string", enum: ["verified"] },
            claims: { type: "array", items: { type: "object", additionalProperties: true } },
            sources: { type: "array", items: { type: "object", additionalProperties: true } },
            absence_checks: { type: "array", items: { type: "object", additionalProperties: true } },
            policy_checks: { type: "array", items: { type: "object", additionalProperties: true } },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        QueueResponse: {
          type: "object",
          required: ["panel_id", "k", "items", "meta", "disclaimer"],
          properties: {
            panel_id: { type: "string" },
            k: { type: "integer" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rank: { type: "integer" },
                  patient_id: { type: "string", format: "uuid" },
                  display_name: { type: "string" },
                  patient_priority_score: { type: "integer" },
                  priority_band: PRIORITY_BAND,
                  priority_label: PRIORITY_LABEL,
                  verified_gap_count: { type: "integer" },
                  top_gap_id: { type: "string", format: "uuid" },
                  top_gap_type: GAP_TYPE,
                  top_gap_priority_score: { type: "integer" },
                  headline: { type: "string" },
                  recommended_coordinator_action: { type: "string" },
                },
              },
            },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        MetricsResponse: {
          type: "object",
          required: ["panel_id", "measured", "modeled", "scenario_assumptions", "external_research", "meta", "disclaimer"],
          properties: {
            panel_id: { type: "string" },
            measured: { type: "array", items: { $ref: "#/components/schemas/ImpactMetric" } },
            modeled: { type: "array", items: { $ref: "#/components/schemas/ImpactMetric" } },
            scenario_assumptions: { type: "array", items: { $ref: "#/components/schemas/ImpactMetric" } },
            external_research: { type: "array", items: { $ref: "#/components/schemas/ImpactMetric" } },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        ImpactMetric: {
          type: "object",
          required: ["metric", "value", "unit", "classification"],
          properties: {
            metric: { type: "string" },
            value: { type: "number" },
            unit: { type: "string" },
            classification: { type: "string", enum: ["MEASURED", "MODELED", "SCENARIO_ASSUMPTION", "EXTERNAL_RESEARCH"] },
            source: { type: "string" },
            basis: { type: "string" },
          },
        },
        EvaluationResponse: {
          type: "object",
          required: ["evaluation", "meta", "disclaimer"],
          properties: {
            evaluation: {
              type: "object",
              required: ["benchmark_run_id", "benchmark_version", "status", "limitations"],
              properties: {
                benchmark_run_id: { type: "string" },
                benchmark_version: { type: "string" },
                status: { type: "string" },
                partition: { type: ["string", "null"] },
                extraction: { type: ["object", "null"], additionalProperties: true },
                gap_detection: { type: ["object", "null"], additionalProperties: true },
                grounding: { type: ["object", "null"], additionalProperties: true },
                hard_negatives: { type: ["object", "null"], additionalProperties: true },
                priority: { type: ["object", "null"], additionalProperties: true },
                end_to_end: { type: ["object", "null"], additionalProperties: true },
                latency: { type: ["object", "null"], additionalProperties: true },
                limitations: { type: "array", items: { type: "string" } },
              },
            },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
        HealthResponse: {
          type: "object",
          required: ["status", "api_version", "request_id"],
          properties: {
            status: { type: "string", enum: ["ok"] },
            api_version: { type: "string", enum: ["v1"] },
            request_id: { type: "string" },
          },
        },
        ReadinessResponse: {
          type: "object",
          required: ["status", "cache_version", "patient_count", "api_version", "request_id"],
          properties: {
            status: { type: "string", enum: ["ready", "not_ready"] },
            cache_version: { type: ["string", "null"] },
            patient_count: { type: "integer" },
            api_version: { type: "string", enum: ["v1"] },
            request_id: { type: "string" },
          },
        },
        ActionResponse: {
          type: "object",
          required: ["gap_id", "action", "recorded_at", "intelligence_unchanged", "meta", "disclaimer"],
          properties: {
            gap_id: { type: "string", format: "uuid" },
            action: { type: "string", enum: ["acknowledged", "contacted", "reviewed"] },
            recorded_at: { type: "string", format: "date-time" },
            intelligence_unchanged: { type: "boolean", enum: [true] },
            meta: META,
            disclaimer: DISCLAIMER,
          },
        },
      },
    },
  };
}

export function openApiJson(): string {
  return `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`;
}
