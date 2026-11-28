# Compliance Matrix

| ID | Requirement | Source | Mandatory | Artifact | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| SUB-001 | Project title | Official rules | Yes | Form | PASS | Continua |
| SUB-002 | Repository | Official rules | Yes | GitHub | PASS | repository URL |
| SUB-003 | Demo video | Official rules | Yes | Video | PASS | `artifacts/reliability/backup-walkthrough.webm` |
| SUB-004 | Synthetic data boundary | Responsible AI | Yes | Docs | PASS | `docs/safety/system-card.md` |
| SUB-005 | Claims audit | Responsible AI | Yes | Docs | PASS | `lib/claims/registry.ts` |
| SUB-006 | Benchmark validity | Evaluation | Yes | Artifact | PASS | `artifacts/reliability/golden-regression.json` |
| SUB-007 | Reliability gates | Reliability | Yes | Artifact | PASS | `artifacts/reliability/report.json` |
| SUB-008 | Performance budgets | Performance | Yes | Docs | PASS | `docs/release/performance-budget.md` |
| SUB-009 | Visual system | Visual | Yes | Docs | PASS | `docs/design/visual-system.md` |
| SUB-010 | Documentation package | Documentation | Yes | Docs | PASS | `docs/getting-started/evaluator-quickstart.md` |
| SUB-011 | Reproducibility manifest | Reproducibility | Yes | Artifact | PASS | `artifacts/reproducibility/manifest.json` |
| SUB-012 | Submission manifest | Submission | Yes | Artifact | PASS | `artifacts/submission/submission-manifest.json` |
| SUB-013 | Approved claims | Responsible AI | Yes | Artifact | PASS | `artifacts/submission/approved-claims.json` |
| SUB-014 | Credits | Licensing | Yes | Artifact | PASS | `artifacts/submission/credits.md` |
| SUB-015 | Canonical screenshots | Submission | Yes | Artifact | PASS | `artifacts/submission/screenshots/` |
| SUB-016 | Architecture assets | Submission | Yes | Artifact | PASS | `artifacts/submission/architecture/` |
| SUB-017 | Live demo URL | Submission | Yes | Link | DRAFT | `artifacts/submission/links.json` |
| SUB-018 | Repository URL | Submission | Yes | Link | PASS | `artifacts/submission/links.json` |

## Code For DFW official requirements

| ID | Requirement | Source | Mandatory | Artifact | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CFD-001 | Sponsor case study selected | Official rules | Yes | Exec summary | FILL IN | `docs/submission/EXECUTIVE_SUMMARY.md` §1 |
| CFD-002 | Executive summary, 1–3 pages (case study, problem statement, solution) | Official rules | Yes | Document | PASS | `docs/submission/EXECUTIVE_SUMMARY.md` (3-page PDF) |
| CFD-003 | GitHub repository link | Official rules | Yes | Link | PASS | https://github.com/bhuwanb23/Continua |
| CFD-004 | Live demo or clear run instructions | Official rules | Yes | Link / README | PASS (run) · PENDING (URL) | README Quick start · `vercel.json` |
| CFD-005 | 1–2 minute demo video on YouTube or Vimeo | Official rules | Yes | Video | PENDING | `docs/submission/VIDEO_SCRIPT.md` |
| CFD-006 | Disclosure of generative AI tools used | Official rules | Yes | Document | PASS (add tool names) | `AI_DISCLOSURE.md` |
| CFD-007 | Functional, not a mockup | Official rules | Yes | App | PASS | All routes 200 from a fresh clone; `npm run validate` green |
