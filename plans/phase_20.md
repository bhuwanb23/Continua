# Phase 20 — Submission Package

> Depends on: Phase 19 (docs) · Unblocks: Phase 21
> Gate: **submission checklist 100%**

## Objective

Assemble every CodeForDFW deliverable — early, not on the final evening. Each artifact is written for a different reader: the skimmer, the evaluator, the judge, the engineer.

## Sub-phases

### 20.1 Executive summary (1–3 pages)

- Problem (one paragraph), user, three gap types.
- Product: 80 → 5, with why/evidence/action.
- Architecture: one diagram + the "LLM extracts, rules decide" line.
- Evidence: actual benchmark numbers.
- Impact: measured vs modeled, clearly separated.
- Limitations + roadmap.
- **Rule:** every number here traces to `docs/CLAIMS.md`.

### 20.2 GitHub repository

- Public (or shared with organizers), evaluator-ready.
- Clean history, meaningful commit messages.
- `README.md` renders correctly on GitHub (no broken relative links).
- No secrets, no `.env`, no large binaries outside the demo video asset.
- Release tag e.g. `v1.0-codefordfw` with the demo video attached.

### 20.3 Live demo deployment

- Stable Vercel URL, `DEMO_MODE=true`, cache-backed.
- Verified in an incognito window with no key configured.
- A `/health`-style check documented for troubleshooting.
- Deployment pinned to the release tag, not a moving branch.

### 20.4 Demo video (1–2 minutes)

- Follows the Phase 13 beats (compressed if needed).
- Captions or on-screen text for every claim (judges may watch muted).
- Ends with the benchmark number, not a logo.
- Synthetic-data disclaimer visible.

### 20.5 Devpost submission

- Extremely concise: what it does, how it works, what was measured, what's next.
- Built-with list (Next.js, Tailwind, Supabase, LLM API, Vercel).
- Links: repo, live demo, video.
- Screenshots: queue, Maria timeline, evidence drawer, eval screen.
- **No claim that a live EHR integration exists.**

### 20.6 Submission checklist

```
[ ] Executive summary (PDF/markdown)
[ ] GitHub repo public + tagged
[ ] Live demo URL verified incognito
[ ] Demo video uploaded + linked
[ ] Devpost form complete
[ ] Screenshots attached
[ ] Built-with list accurate
[ ] Synthetic-data disclaimer present in every artifact
[ ] No PHI / no secrets anywhere
[ ] Claims audited against docs/CLAIMS.md
[ ] Deadline confirmed (Nov 25, 2026, 5:00 pm CST)
```

## Deliverables

| Artifact | Location |
|---|---|
| Executive summary | `docs/EXECUTIVE_SUMMARY.md` + PDF |
| Repo tag | GitHub release |
| Live demo | Vercel URL |
| Video | release asset + Devpost |
| Devpost copy | `docs/DEVPOST.md` (source of truth) |

## Gate — exit criteria

- [ ] Checklist 100% (no partial boxes).
- [ ] Every link opens from a logged-out browser.
- [ ] Video length 60–120 s, captioned, disclaimer visible.
- [ ] Repo clones clean and the flagship test passes on a fresh machine.
- [ ] No artifact claims a feature that is not in the build.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Writing everything at the deadline | Each artifact drafted in its phase, finalized here |
| Video overselling (e.g., "integrates with Epic") | Claims audit blocks it |
| Demo URL pointing at a dev branch | Pin to release tag |

## Handoff to Phase 21

Phase 21 turns the package into a spoken narrative and prepares for hostile questions.
