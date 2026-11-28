# Generative AI Disclosure

Code For DFW requires disclosure of any generative AI tools used. The rules allow AI tools for brainstorming, coding, debugging and more. This document covers (1) how AI was used to **build** Continua and (2) how AI is used **inside** the product.

## 1. AI used during development

| Area | How AI was used | Human role |
|---|---|---|
| Brainstorming and research | Exploring DFW industries, care-coordination workflows and problem framing | Chose the problem, defined scope and success criteria |
| Specification | Drafting and stress-testing the frozen spec, gap rules and edge cases | Reviewed and resolved every contradiction; froze the spec |
| Coding | AI coding assistants generated and refactored code across phases | Directed architecture, reviewed changes, ran and fixed tests |
| Testing and debugging | Writing test cases, diagnosing failures, fault-injection scenarios | Decided pass/fail gates; verified with `npm run validate` |
| Documentation | Drafting docs, README, executive summary and demo script | Edited for accuracy; every number traces to a measured artifact |

**Tools used:** <!-- EDIT: list the exact tools you used, e.g. ChatGPT, Claude, Cursor, GitHub Copilot, Gemini --> _[list tools here]_

**Safeguards we applied to AI-written code:**
- Every change had to pass the full quality gate (lint, strict typecheck, 805 tests, safety, leakage and secret scans).
- Gap logic is deterministic and unit-tested. No AI output is trusted without a test.
- Every metric shown in the product or the docs is pulled from a claim registry tied to a measured benchmark artifact, so AI-drafted text can't introduce unmeasured numbers.

## 2. AI inside the product

- **Role:** a language model is *optionally* used to **extract** structured clinical events from unstructured notes. Supported providers: OpenRouter, Ollama (local) and Gemini.
- **Not its role:** the AI never decides whether a gap exists, never ranks patients, and never writes the claims shown to coordinators. Deterministic rules and an evidence verifier do that ([ADR-001](docs/decisions/ADR-001-hybrid-ai-deterministic-reasoning.md)).
- **Demo and judging path:** no live AI calls. The demo serves a frozen, validated cache built with *fixture-replay* extraction, so results are reproducible and need no API keys.
- **Data:** all data is synthetic. No real patient information was ever sent to any AI service.
