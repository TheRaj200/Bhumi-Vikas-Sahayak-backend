# Backend memory

AI: read this at the start of every task. Update it at the end of every task. Keep it short — replace stale lines instead of appending forever.

## Current status

- Contract version implemented: none yet (target v1.0)
- Last updated: 2026-10-11 — empty backend, only `package.json`

## Endpoints

| Endpoint | Status | Notes |
|---|---|---|
| GET /api/health | todo | |
| POST /api/ask | todo | |
| POST /api/calculate | todo | |
| GET /api/rules | todo | |
| GET /api/rules/:rule | todo | |
| GET /api/eval/latest | todo | |
| /pdf/en.pdf, /pdf/hi.pdf | todo | |

## Done

- (nothing yet)

## Next steps

1. Set up Express + TS + tsx, `"type": "module"`, scripts, `.env`
2. `rulesStore` + `GET /api/rules`, `/api/rules/:rule`, `/api/health`, static PDFs
3. Search + LLM + quote verification → `POST /api/ask`
4. Table JSON skeletons → human verifies → `POST /api/calculate`
5. Eval runner + `GET /api/eval/latest`

## Human-verified data status

| File | Verified by | Notes |
|---|---|---|
| src/data/tables/… | — | |
| src/data/amendments.json | — | |
| eval/answer_key.json | — | |

## Known issues

- (none)

## Requests for frontend

- (none)
