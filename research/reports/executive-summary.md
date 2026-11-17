# Hackathon Intelligence Package — Executive Summary

## Mission
Build an intelligence advantage for **CodeForDFW** (virtual, student-only hackathon, Nov 6–25, 2026) before sponsors/case studies drop, so that when they do, we can go from "Sponsor Released → Root Cause Analysis → Architecture → Build Plan" in hours.

## Priority 1 — Judge Dossiers (COMPLETE)
All three judges are **Prosper High School seniors** (high school students), not industry veterans. This is a student-run hackathon.

| Judge | Profile | What they'll reward |
|-------|---------|----------------------|
| **Sanjay Jillellamudi** | National Merit Semifinalist; organizer/contact of CodeForDFW; academic/STEM | Design, polish, completeness, clear communication, functional prototype, real business utility |
| **Shreyansh Rath** | National Merit Semifinalist; UTSA CARE AI high-school research fellow; co-author on AAAI 2026 (under review) multi-agent medical-summarization paper | AI/ML substance, technical correctness, responsible/ethical AI, healthcare/NLP relevance, measurable quality |
| **Jad Diab** | Prosper HS senior; finalist in TXBHA Fall Case Competition (UT Austin McCombs); PCIS program | Business value, feasibility, clear narrative, healthcare/finance/policy domains |

**Net winning formula (judges):** clean, well-designed working prototype × validated AI/tech substance × crisp business story tied to sponsor pain point. Single published criterion = "Design," so polish/demo quality is the scored axis, but judges' backgrounds imply implicit tech + business weighting.

## Priority 2 — Winning Project Analysis (COMPLETE)
- Dataset: 28 real winning projects (HackDFW 2021–2022, HackFW 2026, DFWhacks 2025) in `winning-projects/winning-projects.csv`.
- Dominant stack: React/React Native, Firebase/PostgreSQL, Flask/Node, AWS/Google Cloud. AI used as a *feature*, not the whole product.
- Winning formula: sponsor-aligned problem + working demo + clean design + AI substance + business narrative with a metric + 1–2 min demo video.
- Recommended CodeForDFW stack: **Next.js + Tailwind + Supabase + OpenAI/Anthropic API + Vercel**.

## Priority 3 — Organizer Intelligence (COMPLETE)
- CodeForDFW is a **student-run initiative** (organizer: Sanjay Jillellamudi), not a registered company/nonprofit/school program. Inaugural edition 2026.
- Virtual, 1 week, 30 participants, 1 non-cash prize, 9 winner slots, "Open Ended / Social Good / Beginner Friendly."
- Each team picks a sponsor case study (Easy/Medium/Hard) tied to a real local DFW business + real problem. Deliverables: 1–3 page executive summary, GitHub repo, live demo/run instructions, 1–2 min demo video.
- No sponsor list published yet; case studies drop later.

## Priority 4 — DFW Business Landscape (COMPLETE)
- Top sectors by employment: Trade/Transportation/Utilities (~20.5%), Business & Professional Services (~18.5%), Education & Health (~12%), Leisure & Hospitality (~10%), Manufacturing (~6–9% in FW), Financial Activities (~10%).
- Cross-cutting SMB pain points: lead response speed, no-shows, review generation, document/data-entry automation, scheduling/dispatch across a sprawling metro, after-hours customer Q&A.
- AI opportunities with clearest ROI: 24/7 intake chatbots, automated quoting, appointment reminders, review-request sequences, document/OCR automation, demand forecasting.
- Highest-leverage case-study domains given judges: **healthcare** (Jad + Shreyansh) and **logistics** (DFW identity).

## Sponsor Prediction (BONUS)
- 144 DFW companies ranked High/Medium/Low in `sponsors/dfw-companies.csv` (55 High, 51 Medium, 38 Low).
- Top High clusters: healthcare practices/clinics, home services/trades, local restaurant chains, mid-size tech-forward logistics, local associations/chambers/startup hubs, DFW-based accounting firms, nonprofits.

## Knowledge Base Structure
```
research/
├── judges/          (sanjay, shreyansh, jad)
├── organizers/      (codefordfw)
├── sponsors/        (dfw-companies.csv + README)
├── competitors/     (similar-hackathons)
├── winning-projects/ (winning-projects.csv + patterns)
├── industries/      (dfw-industries)
├── technologies/    (tech-landscape)
└── reports/         (executive-summary)
```

## Recommended Next Steps (user's stated plan)
1. Build sponsor-selection framework + win-probability model from this data.
2. When case studies drop: map sponsor → industry → pain points → architecture → build plan within hours.
3. Pre-decide the tech stack (Next.js + Tailwind + Supabase + LLM API + Vercel) and a reusable project skeleton so build starts instantly.
4. Pre-build reusable components: intake chatbot, scheduling UI, demo video script template, executive summary template.

## Limitations / Data Gaps
- No official CodeForDFW sponsor list exists yet (predictions only).
- Judges are high school students with limited public footprints: no public GitHub for any of the three; Sanjay/Jad have no published research or startup history. Inferences about preferences are drawn from their documented activities (National Merit, UTSA CARE AI research, TXBHA case competition, PCIS).
- Company sizes/industries in the sponsor CSV are approximate from public sources.
- Winning-project dataset is HackDFW-centric (28 entries); broader MLH/Devpost sampling was not exhaustively collected. Treat patterns as directional.
- No code was written (per instruction: research only).
