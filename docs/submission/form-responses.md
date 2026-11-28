# Form Responses

Project name: Continua

Tagline: Continuity intelligence for care coordinators

Short description:
Continua is a synthetic-data prototype that reconstructs fragmented care
records into source-linked patient journeys, verifies continuity gaps, ranks
verified intervention priorities, and shows exact evidence for every displayed
issue.

Long description:
Continua helps care coordinators spend time on patients instead of searching
across fragmented records. It uses deterministic rules, evidence verification,
and transparent priority ranking. No live LLM or external database is required
for the judge path.

Problem:
Care coordinators lack time to find what matters across fragmented records.

How we built it:
Next.js, TypeScript, frozen synthetic cache, deterministic detectors, evidence
verification, intervention priority, and rehearsed fallbacks.

Challenges:
Keeping AI extraction separate from gap detection and evidence verification;
preventing unsafe absence claims from partial data; making the demo reliable.

Accomplishments:
Frozen benchmark metrics, fail-closed cache/evidence, 102 reliability tests, 14
injected faults with zero unsafe failures, and a rehearsed demo fallback.

What we learned:
Separating extraction, detection, evidence, and priority makes the system
auditable and safer.

What's next:
Documentation, reproducibility, and deployment hardening.

GitHub: https://github.com/bhuwanb23/Continua

Demo: LIVE_DEMO_URL (local: `npm ci && npm run dev`)

Video: VIDEO_URL (backup: `artifacts/reliability/backup-walkthrough.webm`)

Full paste-ready Devpost copy: [`DEVPOST_SUBMISSION.md`](DEVPOST_SUBMISSION.md)
