export { eventFingerprint, groupByFingerprint, type FingerprintGroup } from "./fingerprint";
export { mentionContextOf, typedIdentity } from "./mention-context";
export { selectRepresentative, type DocumentDateLookup } from "./merge";
export {
  RECONCILIATION_VERSION,
  reconcileClinicalEvents,
  type AttachedProvenance,
  type MergedDuplicate,
  type ReconciliationLedger,
  type ReconciliationResult,
  type RetainedHistorical,
} from "./reconcile";