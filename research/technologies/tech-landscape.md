# Technology Landscape (2026) — Hot Tech for Hackathons & Business

## AI / LLMs
- **OpenAI (GPT-4o, o-series):** Highest adoption; best ecosystem; strong for chatbots, extraction, summarization. Weakness: cost at scale; vendor lock-in.
- **Anthropic (Claude):** Strong on reasoning, long context, safety; popular for coding agents. Weakness: smaller ecosystem than OpenAI.
- **Google Gemini:** Multimodal (vision+audio+text), generous free tier, integrates with Google stack. Weakness: less mature tooling.
- **Hackathon applicability:** HIGH — LLM APIs are the #1 "AI feature" add-on. Use for chatbots, doc extraction, summarization, classification, Q&A over business data.
- **Business applicability:** HIGH — customer Q&A, document processing, intake automation.

## AI Coding Tools
- **Cursor / Windsurf:** AI-native IDEs; accelerate dev 2–5x. Hackathon applicability: HIGH (speed). Weakness: requires human review; can introduce bugs.

## Full-Stack Frameworks
- **Next.js (React):** Dominant for web apps + API routes + Vercel deploy. Hackathon applicability: HIGH.
- **React:** Ubiquitous UI layer.
- **FastAPI (Python):** Best for Python/ML backends; auto docs; fast. Hackathon applicability: HIGH for AI-heavy backends.
- **Supabase:** Postgres + auth + storage + realtime + edge functions; fastest path to a working app with auth. Hackathon applicability: VERY HIGH.
- **PostgreSQL:** Default relational DB; pairs with Supabase.

## Automation
- **n8n:** Open-source, self-hostable workflow automation; great for AI agents + integrations; popular in DFW SMB automation. Hackathon applicability: MEDIUM-HIGH.
- **Make (Integromat):** Visual automation; easier than n8n for non-devs. Hackathon applicability: MEDIUM.
- **Zapier:** Most integrations; expensive at scale. Hackathon applicability: MEDIUM.

## Analytics / BI
- **Metabase:** Open-source BI; easy embedding. Hackathon applicability: MEDIUM (dashboards for sponsors).
- **Apache Superset:** More powerful, heavier. Hackathon applicability: LOW-MEDIUM.
- **Power BI:** Enterprise standard; good for Microsoft shops. Hackathon applicability: LOW (heavy).

## Hackathon Hot-Stack (recommended)
Next.js + Tailwind + Supabase + OpenAI/Anthropic API + Vercel. Covers design (Tailwind defaults), AI substance (LLM), business utility (auth + DB for real app), fast deploy (Vercel). Matches what CodeForDFW judges (design + AI + business) reward.

## Business-Applicability Notes for DFW SMBs
- Most DFW SMBs run on QuickBooks + spreadsheets + a vertical SaaS (ServiceTitan, Toast, Jobber, Epic/athenahealth). Integration with these (via APIs or CSV import) is a strong differentiator.
- AI chatbots for after-hours intake and document/OCR automation have the clearest, measurable ROI for DFW SMBs (response speed, no-show reduction, review generation).
