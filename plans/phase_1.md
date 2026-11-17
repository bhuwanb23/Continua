# Phase 1 — Repository & Engineering Foundation

> Depends on: Phase 0 (frozen contracts) · Unblocks: Phase 2 (dataset)
> Gate: **clean clone boots, lints, typechecks, and tests pass**

## Objective

Create the skeleton once, and keep it boring. No product decisions here, no UI polish. The only goal is that a stranger (or a judge) can clone, install, and run a green pipeline shell without reading your mind.

## Sub-phases

### 1.1 Stack scaffold

- Next.js (App Router) + TypeScript strict mode.
- Tailwind CSS configured, no custom design system yet.
- Supabase client wrapper (project creation can wait until Phase 10; the interface must exist now).
- LLM client abstraction (`lib/llm/`) with one provider implemented and a `MockProvider` for tests.
- Vercel project linked; preview deploy works from `main`.

**Output:** repo boots with `npm run dev`, deploys a blank shell.

### 1.2 Directory structure

Create exactly this, even if folders are empty with `.gitkeep`:

```
app/
components/
lib/
  llm/
  extraction/
  normalization/
  detectors/
  evidence/
  priority/
  eval/
  types/
data/
  synthetic/
  eval-set/
  demo-cache/
scripts/
tests/
docs/
```

**Rule:** no file outside this layout without a one-line justification in the PR/commit.

### 1.3 Engineering gates (local CI)

- `npm run lint` — ESLint, zero warnings policy for new code.
- `npm run typecheck` — `tsc --noEmit`, strict.
- `npm run test` — Vitest (or Jest), one trivial passing test so the gate is real.
- `npm run check` — runs all three in sequence.

**Output:** a single command that must be green before any phase gate is claimed.

### 1.4 Environment validation

- `.env.example` with `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEMO_MODE`.
- `lib/env.ts` validates at boot and fails loudly with an actionable message.
- Read-only/demo mode must start with **no** `OPENAI_API_KEY` (needed for Phase 10).
- `.env` gitignored; no secrets in repo ever.

### 1.5 Determinism harness

- `lib/util/prng.ts` — seeded PRNG (e.g. mulberry32) used by all generators.
- `scripts/verify-determinism.ts` — regenerates artifacts twice and diffs them.
- Fixed default seed recorded in `scripts/config.ts`.

**Output:** "same seed → byte-identical output" is a testable claim from day one.

### 1.6 Shared types package

- `lib/types.ts` — `GapType`, `PriorityBand`, `EventType`, `Patient`, `Record`, `TimelineEvent`, `Gap`, `QueueItem`, `Metrics`, `EvalReport`.
- Types derived from `research/build-readiness/api-contracts.md` § Types — do not invent shapes here.

### 1.7 Repo hygiene

- README stub with: what this is, how to run, synthetic-data disclaimer.
- `.gitignore`, `.nvmrc`/`engines`, license note.
- Branch convention (`main` protected by habit, not by tooling) and commit style noted in `docs/CONTRIBUTING.md`.

## Deliverables

| Artifact | Exists when |
|---|---|
| `package.json` with `lint` / `typecheck` / `test` / `check` | scripts run green |
| `lib/env.ts` | boot fails clearly on missing config |
| `lib/types.ts` | imports compile across `lib/` |
| `lib/util/prng.ts` | determinism script passes |
| Vercel preview | URL loads shell |

## Gate — exit criteria

- [ ] Fresh clone → `npm install` → `npm run check` passes with zero manual steps.
- [ ] App boots without `OPENAI_API_KEY` (demo mode).
- [ ] App boots **with** a key and the mock provider is selectable by env.
- [ ] Determinism script produces identical output on two consecutive runs.
- [ ] No secret, no real patient data, no vendor SDK beyond the approved stack.
- [ ] `lib/types.ts` matches the frozen API contract field names exactly (`patient_priority_score`, `gap_priority_score`).

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Adding libraries "for later" | Only Next.js, Tailwind, one LLM SDK, one DB client, one test runner. Anything else needs a reason. |
| Schema drift between types and contracts | Types are transcribed from the contract file; a test asserts the field names exist. |
| Environment friction on another machine | Test setup on a second clean directory before leaving this phase. |

## Handoff to Phase 2

Phase 2 uses `lib/util/prng.ts` for generation and `lib/types.ts` for shape. Nothing else from Phase 1 should be touched.
