# backend/AGENTS.md — rules for the AI working on the backend

First read the root `AGENTS.md`, then `backend/MEMORY.md`, then the docs the task needs:
`docs/API_CONTRACT.md` (always for API work), `docs/RULE_COMPILER.md` (engine / encoded rules), `docs/DOMAIN_RULES.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md`.

**You may edit only `backend/**`.** Never touch `frontend/`, `docs/` (unless the user asks) or the source data folder.

## Stack (decided — do not change)

- Node 24, **JavaScript ES modules** (`import`/`export`, `"type": "module"`). **No TypeScript.**
- Express 5 (async errors reach the error handler automatically — just `throw`).
- zod 4 for validation (`src/validation/schemas.js`), Mongoose 9 for MongoDB Atlas, `@anthropic-ai/sdk` for Claude, Vitest for tests.
- Env vars via Node's `--env-file-if-exists=.env` (no dotenv).
- Do **not** add: TypeScript, ORMs other than Mongoose, vector DBs, LangChain/LlamaIndex, auth, Docker, other LLM providers — unless the user asks.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | API with auto-restart on http://localhost:8000 |
| `npm start` | API without watch |
| `npm run seed` | Seed MongoDB (rules, encoded rules, rule tests, sample cases) — idempotent |
| `npm test` | Vitest: data/quote checks, API smoke tests, engine seed tests (when `ENGINE_READY`) |
| `npm run eval` | 17-question benchmark against the running server → `eval/results/latest.json` |

**Before saying a task is done, run `npm test`. It must be green.** Never delete, skip or weaken a test to make it pass — fix the code, or ask the user if the test itself is wrong.

## Folder structure (keep it)

```
backend/
  src/
    server.js              start: connect DB → load rules → load encoded rules → listen
    app.js                 express app: routes, /pdf static, 404, error handler
    config.js              ALL env vars and data paths (only place that reads process.env)
    constants/
      fields.js            every CaseInputs path + derived values, labels, clarification questions, enums
      statuses.js          status model + labels
      strings.js           fixed strings (not_found, disclaimer, …) + report limitations
    data/
      amendments.json      28 Aug 2026 amendment (secondary source, unverified) + triggers
      glossary.json        Hindi/Hinglish → English search terms
      sample_applications.json  4 sample cases (seeded)
    db/connect.js          Mongo connection, dbStatus(), never throws
    models/index.js        all Mongoose models (docs/DATA_MODEL.md)
    validation/schemas.js  zod request schemas for every endpoint (= contract)
    middleware/index.js    requestLogger, requireDb, notFoundHandler, errorHandler
    rules/
      encoded/*.json       11 encoded rules (candidates, UNVERIFIED) — docs/RULE_COMPILER.md
      tests/*.tests.json   seed test cases per rule
      schema.js            zod schema for encoded rules + tests
    engine/                compliance engine — README.md is the implementation guide
    services/
      rulesStore.js        rules in memory, aliases (17-a → 17), quoteInRule, findQuotePage, pdfUrl
      encodedRulesStore.js encoded rules from Mongo (or files), toSummary, isEnabledForChecks
      versionInfo.js       VersionInfo + amendment warnings
      llm.js               ONLY file that calls Claude (completeJson)
      search.js            TODO: BM25 search
      answer.js            TODO: question pipeline
    routes/                one file per area; stubs throw 501 NOT_IMPLEMENTED after validating input
    utils/                 textClean.js (headers, normalise, pages), httpError.js
  scripts/seed.js
  eval/                    questions.json, answer_key.json (HUMAN fills), run.js, results/
  tests/                   *.test.js
```

New files go in the matching folder. One responsibility per file.

## What is already done (do not rewrite — extend)

- Config, DB connection, all models, validation schemas, middleware, error format.
- Routes implemented: `GET /api/health`, `/api/meta`, `/api/rules`, `/api/rules/:rule`, `/api/encoded-rules`, `/api/encoded-rules/:rule_id`, `/api/eval/latest`, `/pdf/en.pdf`, `/pdf/hi.pdf`.
- All other routes exist as **validated stubs** returning `501 NOT_IMPLEMENTED` — replace the `throw notImplemented(...)` line with the real logic. Keep the validation lines.
- 11 encoded rules + ~150 seed tests; every quote/page auto-checked. Seed script. Eval runner.

## Build order (follow `docs/FEATURE_MAP.md`)

1. **Engine** (`src/engine/`, guide in `src/engine/README.md`) → set `ENGINE_READY = true` → all seed tests green.
2. `POST /api/compliance/check` (+ save to `compliance_checks`).
3. `GET /api/rules/search` (`services/search.js`).
4. `POST /api/questions` (`services/answer.js`).
5. Applications CRUD + review events + report.
6. Rule tests endpoints + verification endpoint.
7. Metrics endpoints.

## Question pipeline (`services/answer.js`) — must work like this

1. Validate (zod). Detect language: any Devanagari → `hi`, else `en` (unless `lang` given).
2. Build an English search query: original text + glossary terms (`data/glossary.json`). Optionally a small LLM translate step — never required.
3. `search.js`: BM25 over rule text (headers stripped) + title boost; top 6 rules. Include encoded rules whose `rule_ref`/`parent_rule` match.
4. Amendment triggers (`amendments.json`): rule refs, keywords, plot area ≤ 500 from `inputs` → warning ids.
5. If LLM not configured or fails → `status: "evidence_only"`, `ai_used: false`, evidence = best passages from top rules (quote = a sentence from the rule text, so `quote_verified: true`), `ai_error` set. **Never a 503 for questions.**
6. LLM prompt (system): answer ONLY from the given rule texts (each labelled with its rule number); return strict JSON `{ "status": "answered"|"not_found"|"needs_information"|"manual_review", "answer": "...", "citations": [{ "rule": "56", "quote": "exact text" }], "clarifications": [{ "field": "road_width_m", "question_en": "...", "question_hi": "..." }] }`; quotes copied word for word, one sentence or one table row; answer in the question's language, ≤ 80 words, "Rule X says…"; no outside knowledge; no approval language; no arithmetic. Temperature 0.
7. **Verify every citation** with `rulesStore.quoteInRule(rule, quote)`; drop unverified ones and any rule not in the retrieved set. No verified citation left → `not_found` with the fixed string.
8. Build `Evidence` from `rulesStore` (`title`, `part`, pages, `findQuotePage`, `pdfUrl`) — **never from the LLM**.
9. If the question maps to an encoded rule and `inputs` are given, the engine provides numbers; the LLM only explains them.
10. Add `version` (with warnings), `disclaimer` (in `lang`), `related_encoded_rules`, `latency_ms`; log to `question_logs` if DB connected (question text only if `config.logQuestionText`).

## Compliance check route

`engine.evaluateCase(inputs, listEncodedRules(), { lang })` → add `check_run_id`, `application_id`, `run_at` → save to `compliance_checks` when DB connected (set `applications.latest_check_id` when `application_id` given) → return ComplianceResult. Same inputs + rule versions must give identical findings.

## Verification endpoint (human action)

Run the rule's tests (test mode) → any failure → `409 TESTS_FAILING`. Else update `encoded_rules.verification` (status, verified_by, verified_on = today, checked_pdf_pages, notes), write `review_events` `{ type: "rule_verification" }`, then `await loadEncodedRules()` so the change is live. **AI agents never call this endpoint.**

## Encoded rule files — rules for AI

- Keep files valid against `src/rules/schema.js`; `npm test` checks schema, quotes and pages.
- **Never type a number from memory.** Every value must be visible in the rule text; add/keep the matching `quote` so the test proves it.
- Files always stay `"verification": { "status": "unverified", ... }`.
- Changing a file changes its hash → seed bumps version and resets verification (by design). Tell the user when you change a rule file.
- New tests: add to `src/rules/tests/<RULE_ID>.tests.json` with a unique `name`.

## API rules

- Responses must match `docs/API_CONTRACT.md` exactly (names, types, `snake_case`, `id` not `_id`).
- Errors only via `throw new HttpError(status, code, message)` / zod errors → central handler. No stack traces to clients.
- DB-only routes use `requireDb` → `503 DB_UNAVAILABLE` without Mongo.
- No endpoints outside the contract without a contract change.

## LLM rules (`services/llm.js`)

- Model from `ANTHROPIC_MODEL`, key from `ANTHROPIC_API_KEY` (via `config.js`). Never hard-code model ids elsewhere.
- Only `llm.js` imports `@anthropic-ai/sdk`. Temperature 0, timeout from config, JSON output.
- Never log prompts with keys, never log full question text unless `LOG_QUESTION_TEXT=true`.

## Code style

- Small files and functions, clear names, `async/await`. JSDoc on exported functions that other files use.
- Pure functions in `engine/` (no I/O). Comments only where logic is not obvious. No dead code, no commented-out blocks.

## When you finish a task

Update `backend/MEMORY.md` (status table, done, next steps, known issues, requests for frontend).
