# Backend memory

AI: read this at the start of every task. Update it at the end of every task. Keep it short — replace stale lines instead of appending forever.

## Current status

- Contract implemented: v2.0 (partially — see table)
- Last updated: 2026-10-11 — scaffold complete, `npm test` green (203 passed, 141 engine tests skipped until `ENGINE_READY = true`)
- Runs without `.env` (no DB, no LLM). Needs `MONGODB_URI` for DB endpoints and `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL` for AI answers.

## Endpoints

| Endpoint | Status | Notes |
|---|---|---|
| GET /api/health | ✅ done | |
| GET /api/meta | ✅ done | |
| POST /api/questions | 🟡 stub (validates, 501) | build `services/answer.js` |
| GET /api/rules/search | 🟡 stub (validates, 501) | build `services/search.js` |
| GET /api/rules | ✅ done | |
| GET /api/rules/:rule | ✅ done | aliases like 17-a work |
| POST /api/compliance/check | 🟡 stub | needs engine |
| POST/GET/PUT /api/applications… | 🟡 stub, requireDb | |
| POST /api/applications/:id/review-events | 🟡 stub | |
| GET /api/applications/:id/report | 🟡 stub | |
| GET /api/encoded-rules, /:rule_id | ✅ done | from Mongo if seeded, else files |
| PATCH /api/encoded-rules/:rule_id/verification | 🟡 stub, requireDb | human only |
| GET/POST /api/encoded-rules/:rule_id/tests, /tests/run | 🟡 stub | |
| POST /api/rule-tests/run | 🟡 stub | |
| GET /api/eval/latest | ✅ done | reads eval/results/latest.json |
| POST/GET /api/metrics/lookup-timings… | 🟡 stub, requireDb | |
| /pdf/en.pdf, /pdf/hi.pdf | ✅ done | |

## Done

- Express 5 app, config, Mongo connect (non-fatal), 10 Mongoose models, zod request schemas, error handler
- rulesStore (header stripping, aliases, quote verification, quote → page), encodedRulesStore, versionInfo, llm wrapper
- 11 encoded rules + seed tests (all quotes/pages auto-verified against the dataset)
- Seed script (idempotent, version bump + verification reset on change), sample cases, eval runner, answer key skeleton

## Next steps

1. Engine (`src/engine/README.md`) → `ENGINE_READY = true` → all seed tests pass
2. POST /api/compliance/check
3. Search, then questions pipeline
4. Applications + review events + report
5. Rule tests endpoints + verification endpoint
6. Metrics

## Human-verified data status

| Item | Verified by | Notes |
|---|---|---|
| R2_5_C_AMENDMENT_2026 | — | official notification not seen yet |
| R17_FARM_HOUSE | — | |
| R17A_AGRI_TOURIST | — | |
| R21_FEES | — | slab table p.36, multipliers p.36–37 |
| R23_SANCTION_DURATION | — | |
| R42_TALL_BUILDINGS | — | Tables 4/5 p.58–59, row-by-height interpretation |
| R52_ELECTRIC_LINES | — | |
| R56_RESIDENTIAL_OPEN_SPACES | — | |
| R61_FAR | — | |
| R65_HEIGHT_LIMIT | — | interpretation needs confirmation |
| R83_LIFTS | — | |
| eval/answer_key.json | — | 17 items empty |
| data/amendments.json | — | secondary source only |

## Known issues

- `eval_runs` collection exists but eval runner writes only the JSON file (optional mirror).

## Requests for frontend

- (none)
