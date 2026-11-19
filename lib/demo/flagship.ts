/**
 * Frozen ids for the Phase 13 flagship path.
 *
 * `FLAGSHIP_GAP_ID` is Maria's high-severity missed-followup gap, the one the
 * Phase 13 storyboard reveals. Note: `maria.json` (Phase 10) records
 * `flagship_gap_id` as the duplicate CBC gap because the cache builder took
 * Maria's first gap in list order. Phase 13 does not rewrite frozen cache
 * artifacts; it records the difference in
 * `artifacts/demo/flagship-manifest.json` and always reads the real values.
 */
export const FLAGSHIP_PATIENT_ID = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";
export const FLAGSHIP_GAP_ID = "77c292e1-e3d2-52f8-9e5c-d7fdd38cee41";

/** Gap id recorded in `maria.json` by the frozen Phase 10 cache build. */
export const CACHE_MARIA_GAP_ID = "6c55444c-b2fb-5f94-aabf-8f2905c141e0";

export const BACKUP_PATIENT_ID = "2e747376-7b45-5793-802a-247bc9ccd60f";
export const BACKUP_GAP_ID = "8ece28d5-1220-5f60-9f2e-b4dc5ff6b94b";

export interface DemoScene {
  id: number;
  kicker: string;
  title: string;
  spoken: string;
  caption: string | null;
}

export const SCENES: readonly DemoScene[] = [
  {
    id: 1,
    kicker: "0–10s",
    title: "The problem",
    spoken:
      "Care coordinators don't lack patient data. They lack time to find what matters across fragmented records.",
    caption: "Continua turns the full panel into the coordination issues worth reviewing first.",
  },
  {
    id: 2,
    kicker: "10–23s",
    title: "80 → 5",
    spoken:
      "Sarah has 80 synthetic patients. Continua reconstructs their care journeys, verifies continuity gaps, and gives her a ranked review queue.",
    caption:
      "These five aren't predicted to be clinically high risk. They're the five highest-priority verified coordination issues under our workflow model.",
  },
  {
    id: 3,
    kicker: "23–42s",
    title: "Maria's journey",
    spoken:
      "Let's look at Maria. Her information is spread across primary care, surgery, imaging, labs and medication records. Continua reconstructs those records into one source-linked journey.",
    caption: "Every event on this timeline points back to a source document.",
  },
  {
    id: 4,
    kicker: "42–61s",
    title: "The gap",
    spoken:
      "This referral asked for medical-oncology follow-up within 45 days. That window passed, and Continua found no qualifying completed oncology consultation in the available records.",
    caption:
      "Instead of burying that signal in another summary, Continua turns it into a coordinator action.",
  },
  {
    id: 5,
    kicker: "61–76s",
    title: "Evidence",
    spoken:
      "Continua doesn't ask Sarah to trust a black box: the exact source, the source-defined window, and the search over Maria's available records.",
    caption:
      "If required evidence can't be verified, Continua suppresses the gap rather than showing it.",
  },
  {
    id: 6,
    kicker: "76–90s",
    title: "Proof",
    spoken:
      "Under the hood, the AI only extracts structured facts. Deterministic rules detect gaps, a separate evidence layer verifies every displayed claim, and our intervention-priority engine ranks only verified issues.",
    caption:
      "Continua helps coordinators spend their time on patients, not on finding the signal hidden in the chart.",
  },
] as const;

export const SCENE_COUNT = SCENES.length;
