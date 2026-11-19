# Phase 13 rehearsal checkpoint

- Date: 2026-11-19
- Cache validation: PASS (`npm run validate:demo-cache`)
- Typecheck: PASS (`npx tsc --noEmit`)
- Lint: PASS (`npx eslint app/demo components/demo lib/demo tests/demo`)
- Build: PASS (`npm run build`, `/demo` prerendered, 6 kB)
- Tests: PASS (`npx vitest run tests/demo`, 12 tests)
- Dev-server smoke: PASS (`/demo` 200 on port 3001)
- Scene count: 6
- Evidence click budget: 1
- Rank disclosure: Maria rank 27, not #1
- Fallback patient: backup gap verified, evidence loads
- Unsupported claims: 0

## Gates
- A. Problem in 10s: Scene 1 spoken line is the problem statement.
- B. Product in 30s: Scene 2 shows the real queue.
- C. Intelligence in 60s: Scenes 3-4 show reconstruction and the gap.
- D. Trust in 90s: Scenes 5-6 show evidence + architecture.
- E. Truth intact: frozen cache unchanged, rank 27, flagship gap from API.
- F. No fake live processing: 0 primary LLM calls during demo.
- G. No clinical-outcome/ROI claims: see claim-audit.
- H. Demo reset: `/demo?reset=1` clears sessionStorage.
- I. Fallback: DemoFallback + local app + screenshots.
- J. Regression test: 12 tests.
