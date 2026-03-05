# AGENTS.md

## Cursor Cloud specific instructions

### Overview
AI Fantasy Coach — a Next.js 15 single-service app (App Router, Turbopack, React 19) that pulls NFL fantasy data from the ESPN API and provides AI-powered coaching insights via OpenAI.

### Dev commands
Standard scripts in `package.json`: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm start`.

### Running the dev server
The OpenAI SDK instantiates at module scope, so both `pnpm dev` and `pnpm build` require `OPENAI_API_KEY` to be set (even a placeholder works for build/dev if you don't need AI Coach features):
```
OPENAI_API_KEY=sk-placeholder pnpm dev
```

### Environment variables
| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes (for module init) | OpenAI GPT-4o-mini for coach brief summaries. A placeholder unblocks dev/build; real key needed for AI Coach. |
| `ESPN_SWID` | For live data | ESPN session cookie for authenticated league API access. |
| `ESPN_S2` | For live data | ESPN session cookie (espn_s2). |

Without `ESPN_SWID`/`ESPN_S2`, the app still renders with cached/sample data but API routes return errors for live data.

### Architecture notes
- Single Next.js service on port 3000 (no database, no Docker, no external infrastructure).
- League config (ID, team, year) is hardcoded in `lib/espn/fetchers.ts`.
- `experimental.useCache` is enabled in `next.config.ts`.
