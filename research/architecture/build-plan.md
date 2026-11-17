# Hackathon Build Plan — Continua

Assumption: ~2–3 days of build time, 1–2 builders, plus polish. Phases are ordered so that a demoable (if rough) product exists after Phase 2.

## Phase 0 — Setup (½ day)

- Create Next.js + Tailwind + TypeScript project; deploy skeleton to Vercel.
- Add Supabase project (or decide local-JSON-only; recommend Supabase for credibility, JSON fallback).
- Add OpenAI SDK; env vars (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- Repo layout: `app/`, `components/`, `lib/`, `data/demo-cache/`, `scripts/`.
- **Exit criterion:** `npm run dev` runs; Vercel preview deploys.

## Phase 1 — Data (½ day)

- Synthetic data generator script: 80 oncology patients + records with planted gaps (Maria + 2 more planted; rest realistic noise).
- Alias maps: test names, drug→lab monitoring map.
- Seed Supabase (or write JSON cache directly).
- **Exit criterion:** `data/demo-cache/*.json` exists and loads in app.

## Phase 2 — Core pipeline (1 day)  ← first demoable milestone

- Stage B: timeline reconstruction (LLM) + grounding validation.
- Stage C: 3 gap detectors (rule candidates + LLM reasoning) + grounding validation.
- Stage D: prioritization + top-5.
- Caching layer for demo panel.
- **Exit criterion:** given the demo panel, app produces top-5 queue + timelines + gaps with evidence. (Can be API-only / rough UI.)

## Phase 3 — UI (1 day)

- Screen 1 Dashboard (top-5 queue, KPIs, gap-type counts).
- Screen 2 Patient detail (timeline + gaps + evidence).
- Screen 3 Evidence deep-dive (drawer).
- Screen 6 Load data (one-click demo load).
- Screen 7 Impact summary.
- Loading/error states; synthetic-data banner.
- **Exit criterion:** full demo path clickable end-to-end.

## Phase 4 — Polish & judging (½–1 day)

- Visual polish: typography, spacing, evidence chips, severity badges, empty states.
- Eval harness (Screen 8) + run + report numbers.
- Record backup demo video.
- Practice the 90-sec pitch 5×; trim to time.
- **Exit criterion:** demo runs in <90 sec, 3× in a row without failure.

## Time budget guardrails

- If behind after Phase 2: skip custom upload (Must→Should), skip eval UI (keep CLI eval), skip Screen 5 list.
- If behind after Phase 3: skip Screen 9 About page; keep polish minimal but never cut timeline/evidence.
- **Never cut:** timeline, gap detection, top-5 queue, evidence grounding, wow line.

## Owners (suggested, 2 builders)

- Builder A: data + pipeline (Phases 1–2) + eval.
- Builder B: UI (Phase 3) + polish (Phase 4) + demo video.
- Shared: pitch practice.

## Definition of done

- [ ] Demo runs end-to-end in <90 sec, 3× consecutively.
- [ ] Wow line lands (spoken + on-screen).
- [ ] Impact numbers displayed.
- [ ] Eval metric + grounding rate reported (UI or slide).
- [ ] Vercel deploy live + URL shareable.
- [ ] Backup demo video recorded.
- [ ] README in repo explains run + synthetic-data disclaimer.