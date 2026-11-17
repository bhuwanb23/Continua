# Sponsor Prediction Engine

## Summary
- **Total companies in dataset:** 144 (`dfw-companies.csv`)
- **Ranking:** High (55) / Medium (51) / Low (38)
- **Method:** DFW-based or DFW-present businesses across the top employment sectors (logistics, healthcare, construction/home services, restaurants, retail, real estate, professional services, manufacturing, finance, nonprofits). Ranked by likelihood of sponsoring a student hackathon case study: local presence + mid-size (not enterprise) + clear operational pain point + community orientation.

## Top "Most Likely Sponsor" (High) clusters
1. **Healthcare practices & clinics** (Texas Oncology, USMD, specialty practices, dental chains, Cook Children's, Methodist, Texas Health Resources, JPS) — aligns with Jad Diab's healthcare case-competition background and Shreyansh's medical-NLP research.
2. **Home services / trades** (Baker Brothers, Berkeys, Lex Air, Mister Sparky, One Hour Air, Horizon, Chambliss, Rescue Air, Crumpler, Texas Ace) — classic SMB case studies; clear measurable ROI (response speed, no-shows, reviews).
3. **Restaurants (local chains)** (Torchy's, Cane Rosso, Pecan Lodge, Hutchins, Hard Eight, etc.) — relatable, demo-able.
4. **Logistics (mid-size, tech-forward)** (Arrive Logistics, MoLo Solutions, Echo, Coyote) — DFW logistics identity; route/dispatch case studies.
5. **Local associations, chambers, startup hubs, nonprofits** (Dallas Regional Chamber, TechFW, The DEC, Capital Factory, North Texas Food Bank, Meals on Wheels) — community-oriented; likely to sponsor social-good case studies.
6. **Real estate brokerages & property mgmt** (Ebby Halliday, Briggs Freeman, Allie Beth Allman, Invitation Homes, American Homes 4 Rent, Lincoln Property, Hillwood).
7. **Accounting firms (DFW-based)** (Whitley Penn, Weaver, Sutton Frost Cary).

## How to use when sponsors drop
1. Match sponsor name → industry in CSV.
2. Pull the "Likely_Problem" column → that's your case study's core pain point.
3. Cross-reference `research/industries/dfw-industries.md` for deeper pain points, current software, AI opportunities.
4. Cross-reference `research/winning-projects/patterns.md` for the winning project shape.
5. Build the sponsor-selection framework + win-probability model (user's stated next step).

## Limitations
- Sponsor list is a *prediction*; actual sponsors may differ. No official sponsor list published for CodeForDFW as of research date.
- Company sizes/industries are approximate from public sources; verify before relying on for outreach.
- Enterprise companies (Low rank) are unlikely to sponsor a student hackathon case study but included for completeness.
