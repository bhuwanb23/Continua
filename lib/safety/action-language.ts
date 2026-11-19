export const ALLOWED_COORDINATOR_ACTIONS = ["acknowledged", "contacted", "reviewed"] as const;

export const ALLOWED_OUTPUT_LABELS = {
  gap_card: "For coordinator verification",
  evidence_drawer: "Available records only",
  priority: "Workflow priority, not clinical risk",
  synthetic: "Synthetic demonstration data",
  disclaimer: "Coordinator decision support only",
} as const;

export const FORBIDDEN_ACTION_VERBS = [
  "prescribe", "order", "administer", "adjust", "titrate", "diagnose", "treat",
  "recommend treatment", "recommend medication", "schedule", "contact patient", "escalate automatically",
] as const;

export const MEDICAL_NECESSITY_PATTERNS: RegExp[] = [
  /medically (necessary|unnecessary|indicated|contraindicated)/i,
  /clinical (necessity|indication|justification)/i,
  /(does|do) not (need|require)/i,
  /should (not )?(receive|get|have|start|stop)/i,
  /withhold (treatment|care|medication)/i,
];

export const RISK_PREDICTION_PATTERNS: RegExp[] = [
  /risk (score|level|prediction|probability)/i,
  /high[- ]risk (patient|individual)/i,
  /likely to (deteriorate|decline|be hospitalized)/i,
  /probability of/i,
];

export const AUTONOMY_PATTERNS: RegExp[] = [
  /automatically (referred|scheduled|contacted|ordered)/i,
  /we (have|will) (scheduled|ordered|contacted|referred)/i,
  /system (will|has) (contact|schedule|order|refer)/i,
  /ai (decided|recommends|approved)/i,
];

export const UNVERIFIED_GAP_PATTERNS: RegExp[] = [
  /possible gap/i,
  /unverified gap/i,
  /candidate gap/i,
];

export const ABSENCE_SCOPING_PATTERNS = {
  unscoped: /no (matching|consult|referral|follow[- ]?up|lab|test|imaging|monitoring|event|record)/i,
  absolute: /never (had|received|documented)|(was|were|has|have) (ever )?(not )?(documented|received|done|performed) at all|did not (ever|receive)|no (record|evidence) (exists|at all)|none (exists|was found)/i,
  scopedSuffix: /in the available records/i,
};

export interface LanguageIssue {
  code:
    | "forbidden_action_verb"
    | "medical_necessity_claim"
    | "risk_prediction_claim"
    | "autonomy_claim"
    | "unverified_gap_reference"
    | "unscoped_absence"
    | "absolute_absence";
  term: string;
  text: string;
}

export function checkOutputLanguage(
  text: string,
  options: { kind?: "action" | "absence" | "summary" | "general" } = {},
): LanguageIssue[] {
  const issues: LanguageIssue[] = [];
  const normalized = text.trim();
  const kind = options.kind ?? "general";

  for (const verb of FORBIDDEN_ACTION_VERBS) {
    if (new RegExp(`\\b${verb}\\b`, "i").test(normalized)) {
      issues.push({ code: "forbidden_action_verb", term: verb, text: normalized });
    }
  }
  for (const pattern of MEDICAL_NECESSITY_PATTERNS) {
    if (pattern.test(normalized)) {
      issues.push({ code: "medical_necessity_claim", term: pattern.source, text: normalized });
    }
  }
  for (const pattern of RISK_PREDICTION_PATTERNS) {
    if (pattern.test(normalized)) {
      issues.push({ code: "risk_prediction_claim", term: pattern.source, text: normalized });
    }
  }
  for (const pattern of AUTONOMY_PATTERNS) {
    if (pattern.test(normalized)) {
      issues.push({ code: "autonomy_claim", term: pattern.source, text: normalized });
    }
  }
  for (const pattern of UNVERIFIED_GAP_PATTERNS) {
    if (pattern.test(normalized)) {
      issues.push({ code: "unverified_gap_reference", term: pattern.source, text: normalized });
    }
  }

  if (kind === "absence") {
    if (ABSENCE_SCOPING_PATTERNS.unscoped.test(normalized) && !ABSENCE_SCOPING_PATTERNS.scopedSuffix.test(normalized)) {
      issues.push({ code: "unscoped_absence", term: "unscoped absence", text: normalized });
    }
    if (ABSENCE_SCOPING_PATTERNS.absolute.test(normalized)) {
      issues.push({ code: "absolute_absence", term: "absolute absence", text: normalized });
    }
  }

  return issues;
}

export function isSafeOutput(text: string, options?: { kind?: "action" | "absence" | "summary" | "general" }): boolean {
  return checkOutputLanguage(text, options).length === 0;
}
