export interface IncidentPlaybook {
  id: string;
  title: string;
  severity: "SEV-1" | "SEV-2" | "SEV-3";
  trigger: string;
  immediate_actions: string[];
  containment: string[];
  notification: string[];
  evidence_to_preserve: string[];
  postmortem: string[];
  nist_functions: Array<"GOVERN" | "MAP" | "MEASURE" | "MANAGE">;
}

export const INCIDENT_PLAYBOOKS: readonly IncidentPlaybook[] = [
  {
    id: "IP-01",
    title: "Prompt injection or unsafe model output",
    severity: "SEV-1",
    trigger: "Model output contains forbidden fields, actions, or instructions derived from record text.",
    immediate_actions: ["Stop serving affected output", "Capture request and response payloads", "Notify safety owner"],
    containment: ["Disable the affected route", "Revert to cached verified output only"],
    notification: ["Safety owner", "Product owner"],
    evidence_to_preserve: ["request_id", "prompt version", "model version", "source document id"],
    postmortem: ["Root cause", "Control gap", "Regression test added"],
    nist_functions: ["MANAGE", "MEASURE"],
  },
  {
    id: "IP-02",
    title: "Wrong-patient evidence or identity leak",
    severity: "SEV-1",
    trigger: "Evidence references another patient or patient identifier appears in another patient's view.",
    immediate_actions: ["Take cache and API offline", "Preserve audit logs", "Notify privacy lead"],
    containment: ["Invalidate cache", "Block affected patient routes"],
    notification: ["Privacy lead", "Security lead"],
    evidence_to_preserve: ["cache version", "request logs", "affected patient ids (internal only)"],
    postmortem: ["Identity boundary review", "Ownership check strengthening"],
    nist_functions: ["MANAGE", "GOVERN"],
  },
  {
    id: "IP-03",
    title: "Benchmark or truth leakage",
    severity: "SEV-2",
    trigger: "Truth labels, expected gaps, or benchmark answers appear in product surfaces or logs.",
    immediate_actions: ["Remove exposed surface", "Rotate any leaked artifact", "Run leakage scan"],
    containment: ["Block runtime import of truth modules", "Purge cached responses"],
    notification: ["Engineering lead"],
    evidence_to_preserve: ["build commit", "scan output", "affected files"],
    postmortem: ["Leakage control review", "New scanner rule"],
    nist_functions: ["MEASURE", "MANAGE"],
  },
  {
    id: "IP-04",
    title: "Cache tampering or integrity failure",
    severity: "SEV-2",
    trigger: "Demo cache validation fails or hashes mismatch.",
    immediate_actions: ["Serve 503", "Preserve cache directory", "Run validation report"],
    containment: ["Rebuild from frozen inputs", "Verify synthetic provenance"],
    notification: ["Engineering lead"],
    evidence_to_preserve: ["validation report", "manifest", "git commit"],
    postmortem: ["Integrity control review", "Rebuild procedure test"],
    nist_functions: ["MANAGE", "MEASURE"],
  },
  {
    id: "IP-05",
    title: "Secret or credential exposure",
    severity: "SEV-1",
    trigger: "A secret, token, or credential appears in repository, logs, or artifacts.",
    immediate_actions: ["Revoke credential", "Remove from history if committed", "Rotate"],
    containment: ["Block deployment", "Run secret scan"],
    notification: ["Security lead", "Engineering lead"],
    evidence_to_preserve: ["scan output", "affected commit"],
    postmortem: ["Secret management review", "Pre-commit control"],
    nist_functions: ["MANAGE", "GOVERN"],
  },
  {
    id: "IP-06",
    title: "Accessibility or oversight failure",
    severity: "SEV-3",
    trigger: "Users cannot reach evidence, controls lack keyboard access, or oversight labels are missing.",
    immediate_actions: ["Document issue", "Provide workaround", "Schedule fix"],
    containment: ["Keep evidence drawer mandatory", "Retain verification labels"],
    notification: ["Product owner"],
    evidence_to_preserve: ["screenshot", "accessibility audit output"],
    postmortem: ["Accessibility review", "Oversight label checklist"],
    nist_functions: ["GOVERN", "MAP"],
  },
] as const;
