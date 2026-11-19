import type { ActionResponse, CoordinatorActionValue } from "@/lib/api/dto";
import { notFound } from "@/lib/api/handler";
import { demoRepository } from "./context";

interface RecordedAction {
  action: CoordinatorActionValue;
  recorded_at: string;
}

const actionLog = new Map<string, RecordedAction>();

export function resetActionLog(): void {
  actionLog.clear();
}

export function recordedAction(gapId: string): RecordedAction | null {
  return actionLog.get(gapId) ?? null;
}

/**
 * Workflow state only. Recording `contacted` never mutates detector output,
 * evidence, benchmark results, or priority history: immutable intelligence and
 * mutable coordination status stay separated.
 */
export async function recordAction(
  gapId: string,
  action: CoordinatorActionValue,
  requestId: string,
): Promise<Omit<ActionResponse, "meta" | "disclaimer">> {
  const gap = await demoRepository().verifiedGaps.getById(gapId);
  if (!gap) throw notFound("gap_not_found", "Gap not found.", requestId);
  const recorded: RecordedAction = { action, recorded_at: new Date().toISOString() };
  actionLog.set(gapId, recorded);
  return {
    gap_id: gapId,
    action,
    recorded_at: recorded.recorded_at,
    intelligence_unchanged: true,
  };
}
