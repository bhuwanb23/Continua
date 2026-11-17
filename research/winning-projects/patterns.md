# Winning Project Pattern Analysis

## Dataset
- 28 entries (HackDFW 2021–2022, HackFW 2026, DFWhacks 2025) in `winning-projects.csv`.
- Plus general hackathon patterns from Devpost/MLH literature.

## What technologies appear most?
1. **Web frontend:** React / React Native (dominant in HackDFW winners).
2. **Backend:** Flask, Node/Express, AWS Lambda, Firebase.
3. **Data store:** Firebase Firestore, PostgreSQL (SQLAlchemy), AWS DynamoDB.
4. **Cloud:** AWS (Amplify, Lambda, Rekognition), Google Cloud (ML, Firebase), Expo.
5. **AI/ML where used:** OpenCV/Rekognition (vision), NLP, ML risk modeling, LLMs (newer). AI is a *feature*, not the whole product.
6. **Mobile:** React Native (Curtainfy) — common for consumer-facing.
7. **IoT:** only in manufacturing challenges (HackFW).

## What presentation format wins?
- Catchy one-word/short project name (Curtainfy, CareHero, EquiTeach, ATOMS, Themis).
- One-sentence value prop in the Devpost description.
- Live hosted demo URL + GitHub repo (table stakes).
- 1–2 min demo video showing the product working (CodeForDFW requires this).
- Executive summary / pitch with problem → solution → impact + metric.

## What project complexity wins?
- **Medium complexity** dominates: shippable in a week, not a research project, not a toy.
- End-to-end "information → decision → action" flow (HackFW judging language) is a strong signal.
- Grand prize (Curtainfy) = medium complexity + clear real-world utility + polished design.
- Sponsor challenges reward using sponsor's tech + addressing sponsor's specific problem.

## What mistakes do losing teams make? (inferred)
1. Submitting mockups/concepts instead of working software.
2. Ignoring the sponsor's specific challenge; building generic "cool" apps.
3. No live demo / unclear run instructions.
4. Over-scoping; not finishing.
5. Weak pitch: no business story, no metric.
6. AI used as buzzword with no validation/measurement.
7. Poor design/UX (matters a lot given CodeForDFW's single "Design" criterion).

## Tech-stack recommendation for CodeForDFW
- **Frontend:** Next.js + React + Tailwind (shippable, great design defaults).
- **Backend:** Next.js API routes or FastAPI.
- **Data:** Supabase (Postgres + auth + storage) — fastest path to a working app with auth.
- **AI:** OpenAI/Anthropic/Gemini API for the "AI feature" (chatbot, summarization, classification, extraction).
- **Deploy:** Vercel (instant live URL for demo).
- **Why:** conventional, fast to ship, great design defaults, easy live demo — matches what judges (design + AI + business) reward.
- **Avoid:** exotic stacks, heavy ML training, hardware/IoT (unless the case study demands it).

## Winning formula (CodeForDFW-specific)
Sponsor-aligned problem × working functional prototype (live demo) × clean design/UX × validated AI/tech substance × crisp business narrative with a metric × 1–2 min demo video.
Weighted implicitly by judges: Design (Sanjay) + AI correctness (Shreyansh) + business value/feasibility (Jad).
