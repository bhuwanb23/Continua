# Local development

## Prerequisites

- Node.js 20+ (baseline recorded at 24.13.0)
- npm 10+ (baseline 11.6.2)
- Git

## Steps

```bash
git clone <repo>
cd continua
npm ci
cp .env.example .env.local
npm run validate
npm run dev
```

Open http://localhost:3000.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit` (strict). |
| `npm run test` | Vitest unit + contract + integration. |
| `npm run test:e2e` | Playwright (needs `npx playwright install`). |
| `npm run validate` | lint + typecheck + tests + spec/data/env/safety. |
| `npm run verify:determinism` | Same seed/inputs → identical output. |

## Demo mode

`CONTINUA_DEMO_MODE=true` (default) means the application boots with **no** external credentials. A live extraction path that needs the LLM throws `ConfigError: LLM provider not configured.`

## Troubleshooting

- **Type errors after pulling:** run `npm ci`; do not mix package managers.
- **Port in use:** `npm run dev -- -p 3001`.
- **Environment failure:** the validator names the offending variable and expected format.
