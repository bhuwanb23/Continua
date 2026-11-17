# Competition Intelligence: Similar Hackathons & Winning Patterns

## DFW Hackathons (reference set)

### HackDFW (students at UTD/SMU/UNT; 24h; design-thinking; corporate sponsors)
- **2021** ($48,750 prizes, 355 participants): Sponsor challenges — Amazon (post-COVID education digital divide), State Farm (telematics), Goldman Sachs (ESG), McKesson (supply chain), Match (connecting), Children's Health (patient experience). Winners: Health Quest, CareHero, convo (3rd place), EquiTeach, Risk AI-verse, Healthy Habits, YoDash, equiTree.
- **2022** ($84,200 prizes): Grand prize Curtainfy (curtain automation for energy savings — React Native + Firebase + Google Cloud). Sponsor challenges: Google (ML), PepsiCo, McKesson, CarMax, State Farm, TIAA. Winners include ATOMS (smart inventory mgmt for frontline healthcare), "The Game of Insurance" (State Farm challenge), Carbon Consulting.
- **Judges (2022):** Hope Shimabuku (USPTO), Nancy Flores (McKesson CIO/CTO), Robert Atkins (Balance Media CEO), Bob Pragada (Jacobs President/COO), James Harding (AI/ML at Google).
- **Judging criteria:** Use of Technology, Functionality, Scalability, Creativity.
- **Pattern:** sponsor-aligned solutions win sponsor prizes; grand prize = real-world impact + working tech + clean demo.

### HackFW: MADE Challenge (Fort Worth DAO + TechFW + Moonshot; Oct 2026; manufacturing focus)
- 30-day sprint, in-person Demo Day at Moonshot HQ.
- Tracks: IoT, ML/AI, RPA. Challenge favors "complete path from capturing information to making a decision and taking action"; runnable, maintainable, README + working demo.
- Judging: technical + product acumen weighted scoring.
- **Pattern:** end-to-end information→decision→action flows; maintainability matters.

### DFWhacks 2025 (Collin College Frisco; 62 participants; Sep 27, 2025)
- Sponsors: JantaPower, PantasticLLC, MakeX Corp.
- Student-organized (Thanveer Muthukumar founder). Beginner-friendly, in-person.

### AI Tinkerers DFW (Replit Agent hackathon, May 2026; 60 apps; Plano)
- Rapid prototyping + agentic workflows focus.

### CodeLaunch DFW (startup accelerator, not a hackathon; Improving/Cyrannus)
- Startup MVP competition; $150K prize; professional hackathon sponsors provide dev teams to finalists.

### Other DFW: DFW IT Association "NOT a Hackathon" AI & Startup Competition (2026, 4th annual).

## Winning Project Patterns (observed across HackDFW 2021–2022)
1. **Sponsor-aligned problem** — winners map directly to a sponsor's stated challenge (McKesson supply chain → McKesson360; Children's Health → patient experience apps; State Farm → insurance education game).
2. **Working, demo-able prototype** — live URL or runnable app; not a slide deck. Curtainfy had a real app tracking sun azimuth and suggesting curtains.
3. **Clear real-world impact metric** — "reduces strain on electric grid," "frees up frontline professionals' time," "decreases digital divide."
4. **Tech stack is conventional and shippable** — React/React Native, Firebase, Flask/Django, PostgreSQL, AWS, Google Cloud, OpenCV, Alexa. No exotic stacks.
5. **AI/ML used as a feature, not the whole product** — e.g., Risk AI-verse (ML risk modeling), Carbon Consulting (AI-assisted feedback), YoDash (NLP). AI serves the business outcome.
6. **Clean design + storytelling** — project names are catchy (Curtainfy, CareHero, EquiTeach, ATOMS); descriptions are one sentence.
7. **Team size 3–5**, mixed skills (design + frontend + backend + domain).
8. **Sponsor prizes reward integration of sponsor tech** (Google Cloud, AWS, etc.) — using sponsor APIs/tools boosts odds.

## What losing teams typically get wrong (inferred)
- Submitting mockups/concepts instead of working software (HackFW explicitly requires runnable).
- Ignoring the sponsor's specific challenge; building generic "cool" apps.
- No live demo / unclear run instructions.
- Over-engineering; not finishing.
- Weak executive summary / pitch (no business story, no metric).
- AI used as buzzword with no validation or measurement.

## Implications for CodeForDFW
- CodeForDFW is week-long (more time than 24h) but still student-only, virtual, sponsor case studies. The winning formula = (sponsor-aligned problem) + (working functional prototype with live demo) + (clean design/UX) + (AI/tech substance that's validated) + (crisp business narrative with a metric) + (1–2 min demo video).
- Since the single published criterion is "Design," polish and demo quality are the scored axis — but judges' backgrounds (AI researcher, business case competitor, academic organizer) imply implicit tech + business weighting.
- Healthcare and logistics case studies are the highest-leverage domains given judge backgrounds.
- Use the sponsor's likely stack if a sponsor is a tech company; otherwise conventional stack (Next.js/React + Supabase/Postgres + an LLM API) is safe and shippable.
- Include a measurable before/after metric in the executive summary and demo video.
