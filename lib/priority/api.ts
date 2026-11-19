import { PRIORITY_DISCLAIMER } from "./explain";
import type { PriorityPanel, QueueApiResponse, QueueItem } from "./types";
import { PRIORITY_VERSION, QUEUE_SCHEMA_VERSION } from "./types";

export function toQueueApiResponse(
  panelId: string,
  panel: PriorityPanel,
  items: readonly QueueItem[],
): QueueApiResponse {
  return {
    schema_version: QUEUE_SCHEMA_VERSION,
    panel_id: panelId,
    k: items.length,
    items: [...items],
    priority_version: PRIORITY_VERSION,
    evaluation_as_of_date: panel.evaluation_as_of_date,
    disclaimer: PRIORITY_DISCLAIMER,
  };
}
