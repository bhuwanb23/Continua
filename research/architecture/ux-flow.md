# Screen-by-Screen UX Flow — Continua

Design target: clean, medical-appropriate, professional (not AI-slop). One primary action per screen. Dark/light neutral palette, clear hierarchy, evidence chips. Hackathon "Design" criterion.

## Navigation

Left sidebar (collapsible): Dashboard · Patients · (Eval — dev only). Top bar: product name + "Synthetic demo data — no real patient information" banner (always visible) + user avatar (Sarah).

---

## Screen 1 — Dashboard (entry)

**Purpose:** Panel-level command center. Answer "who needs me today?"

- Header: "Good morning, Sarah. Panel: 80 patients."
- KPI row: Patients flagged (e.g., 39 of 80) · Gaps detected (e.g., 67) · Top-5 requiring action today.
- Gap-type breakdown (3 cards): Missed follow-ups · Duplicate tests · Monitoring gaps (counts).
- **Primary block: Top 5 Patients Requiring Action** — ranked cards. Each card: rank #, patient name + age/sex, one-line "why" (gap type + key fact), **priority badge (CRITICAL/HIGH/MEDIUM/LOW)**, "View" button.
- Secondary: "Modeled: 12 min manual review assumption → 8.1 s measured synthesis" + "Load demo data" button (if no data).
- Primary action: click a patient card → Screen 2.

## Screen 2 — Patient Detail

**Purpose:** Single patient, full picture + gaps + actions.

- Header: patient name, age/sex, primary diagnosis (e.g., "Breast cancer — post-surgical"), last contact date.
- Left column (60%): **Unified Timeline** — vertical timeline of events across providers: date · event · provider · source doc chip (clickable → shows snippet). Grouped by phase (Surgery, Radiology, Oncology, Labs, Meds).
- Right column (40%): **Care Gaps** (cards) — each: gap type, severity, "Why" (one line), **Evidence** (quoted span + source doc id), **Recommended action** (one line), estimated impact.
- Bottom: "Mark actioned" / "Copy recommended action" buttons; "Back to queue."
- Primary action: review gaps → Screen 3 (evidence deep-dive) on click.

## Screen 3 — Evidence Deep-Dive (modal/drawer)

**Purpose:** Prove grounding. Show the exact source record span for a gap.

- Title: "Evidence for: Missed oncology follow-up."
- Quoted snippet from source doc (highlighted), with doc id, provider, date.
- "Why this is a gap" reasoning (2–3 sentences, structured, not freeform).
- Confidence score (e.g., 0.92) + detector name.
- Close → back to Screen 2.

## Screen 4 — Gap Detail / Action (same as Screen 2 right column expanded)

(Kept as part of Screen 2; no separate route. Documented here to avoid scope creep.)

## Screen 5 — Panel Patients List (all 80)

**Purpose:** Browse/search the full panel; filter by gap type / severity.

- Table: name · age · last contact · gap count · top gap type · **priority** · "View."
- Filters: gap type, priority, "has gaps only."
- Search by name.
- Primary action: click row → Screen 2.

## Screen 6 — Load Data / Setup (first-run)

**Purpose:** Get data in. Demo-first.

- "Load synthetic oncology panel (80 patients)" — one click (primary).
- Optional: paste/upload records (CSV/JSON) for a custom panel.
- Note: "Synthetic data only. No real PHI."
- On load → Screen 1.

## Screen 7 — Impact Summary (modal or dashboard section)

**Purpose:** ROI narrative for the demo.

- "This panel: 80 patients reviewed."
- "Modeled 12 min manual review assumption per patient; 8.1 s measured synthesis (≈15 h modeled savings)."
- Every number on this screen carries a source chip: `assumption` (12 min baseline) or `measured` (latency). No bare "time saved" figure.
- "1 missed oncology follow-up recovered."
- "1 duplicate CBC avoided (~$X)."
- "1 medication monitoring gap caught (A1c)."
- "Gaps detected: [measured] across [measured] patients." (against 70 planted gaps on the frozen benchmark)

## Screen 8 — Eval (dev/demo toggle, optional)

**Purpose:** Technical-depth signal.

- Labeled eval set (e.g., 20 patients with known gaps).
- Per gap type: precision, recall, F1.
- Overall accuracy + "grounding rate" (% gaps with verifiable citations).
- "Run eval" button.

## Screen 9 — About / Method (footer page, optional)

**Purpose:** Credibility + transparency.

- What Continua does / doesn't do.
- "Synthetic data. Not medical advice. Not an EHR."
- AI pipeline summary (link to ai-pipeline.md conceptually).
- Contact.

---

## State & loading

- Every async operation shows a skeleton/spinner with a status line ("Reconstructing timeline…", "Detecting gaps…", "Prioritizing panel…").
- Errors show a friendly message + retry; never a raw stack trace.
- Demo data load is instant (cached); LLM calls for the demo panel are pre-cached so the demo is deterministic.

## Responsive

Desktop-first (coordinator workstation). Tablet acceptable. Mobile out of scope.