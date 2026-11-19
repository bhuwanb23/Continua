import { priorityLabel } from "@/lib/api/display";
import type { QueueResponse } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import { demoRepository } from "./context";

export type QueueItemDto = QueueResponse["items"][number];

/**
 * Returns the frozen queue slice. `k` can only shorten the stored order; the
 * service never re-ranks, so API priority semantics always match Phase 8.
 */
export async function getQueue(
  panelId: string,
  k: number,
  requestId: string,
): Promise<Omit<QueueResponse, "meta" | "disclaimer">> {
  const repository = demoRepository();
  const panel = await repository.panels.getPanel();
  if (panel.panel_id !== panelId) throw notFound("panel_not_found", "Panel not found.", requestId);

  const queue = await repository.priorities.getQueue(k);
  return {
    panel_id: panel.panel_id,
    k: queue.k,
    items: queue.items.map((item) => ({
      rank: item.rank,
      patient_id: item.patient_id,
      display_name: item.display_name,
      patient_priority_score: item.patient_priority_score,
      priority_band: item.priority_band,
      priority_label: priorityLabel(item.priority_band),
      verified_gap_count: item.verified_gap_count,
      top_gap_id: item.top_gap.gap_id,
      top_gap_type: item.top_gap.gap_type,
      top_gap_priority_score: item.top_gap.gap_priority_score,
      headline: item.headline,
      recommended_coordinator_action: item.recommended_coordinator_action,
    })),
  };
}
