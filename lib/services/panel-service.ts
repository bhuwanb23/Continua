import type { PanelResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import { demoRepository } from "./context";

export type PanelSummary = PanelResponse["panel"];

export async function getPanel(panelId: string, requestId: string): Promise<PanelSummary> {
  const panel = await demoRepository().panels.getPanel();
  if (panel.panel_id !== panelId) {
    throw notFound("panel_not_found", "Panel not found.", requestId);
  }
  return {
    panel_id: panel.panel_id,
    name: panel.name,
    patient_count: panel.patient_count,
    patients_with_verified_gaps: panel.flagged_patient_count,
    verified_gap_counts: panel.verified_gap_counts,
  };
}
