import { api } from "@/lib/ui/api";
import { FLAGSHIP_GAP_ID, FLAGSHIP_PATIENT_ID } from "@/lib/demo/flagship";

export interface DemoCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface DemoValidation {
  ok: boolean;
  checks: DemoCheck[];
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "failed";
}

/**
 * Rehearsal preflight. Reads only frozen-upstream endpoints and reports whether
 * the six-scene path can run. It never repairs or rewrites data.
 */
export async function validateDemo(): Promise<DemoValidation> {
  const checks: DemoCheck[] = [];
  const push = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  let patientName = "unknown";
  try {
    const panel = await api.panel();
    push("panel", panel.panel.patient_count > 0, `${panel.panel.patient_count} patients`);
  } catch (error) {
    push("panel", false, message(error));
  }

  try {
    const queue = await api.queue("demo", 5);
    push("top-5 queue", queue.items.length === 5, `${queue.items.length} items`);
  } catch (error) {
    push("top-5 queue", false, message(error));
  }

  try {
    const patient = await api.patient(FLAGSHIP_PATIENT_ID);
    patientName = patient.patient.display_name;
    push("flagship patient", true, patientName);
  } catch (error) {
    push("flagship patient", false, message(error));
  }

  try {
    const timeline = await api.timeline(FLAGSHIP_PATIENT_ID);
    push("timeline", timeline.events.length > 0, `${timeline.events.length} events`);
  } catch (error) {
    push("timeline", false, message(error));
  }

  try {
    const gaps = await api.gaps(FLAGSHIP_PATIENT_ID);
    const flagship = gaps.gaps.find((gap) => gap.gap_id === FLAGSHIP_GAP_ID);
    push("flagship gap", Boolean(flagship), flagship ? flagship.title : "missing");
  } catch (error) {
    push("flagship gap", false, message(error));
  }

  try {
    const evidence = await api.evidence(FLAGSHIP_GAP_ID);
    const ok = evidence.verification_status === "verified" && evidence.sources.length > 0;
    push("evidence", ok, `${evidence.sources.length} sources, ${evidence.verification_status}`);
  } catch (error) {
    push("evidence", false, message(error));
  }

  try {
    const evaluation = await api.evaluation();
    const status = evaluation.evaluation.status;
    push("evaluation", status === "COMPLETED" || status === "not_run", status);
  } catch (error) {
    push("evaluation", false, message(error));
  }

  return { ok: checks.every((check) => check.ok), checks };
}
