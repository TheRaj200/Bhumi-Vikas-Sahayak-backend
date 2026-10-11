# backend/AGENTS.md — rules for the AI working on the backend

First read the root `AGENTS.md`, then `docs/API_CONTRACT.md`, `docs/DOMAIN_RULES.md`, `docs/DECISIONS.md` and `backend/MEMORY.md`.

**You may edit only `backend/**`.** Never touch `frontend/`, `docs/` (unless the user asks) or the source data folder.

## Stack

- Node 24, TypeScript, Express, `zod` for validation, `tsx` to run TS in dev.
- `package.json` must have `"type": "module"`.
- LLM SDKs: `@anthropic-ai/sdk` for Anthropic; Cerebras is OpenAI-compatible (use `openai` SDK with `baseURL: "https://api.cerebras.ai/v1"`) or plain `fetch`.
- `dotenv` for env vars, `cors` for local dev.
- Do **not** add: databases, ORMs, vector DBs, LangChain/LlamaIndex, auth, Docker — unless the user asks.

## Scripts (must exist and work)

| Script | Does |
|---|---|
| `npm run dev` | `tsx watch src/server.ts` on port 8000 |
| `npm run start` | run without watch |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run eval` | run the 17 sample questions, write `eval/results/latest.json` |

**Before saying a task is done, run `npm run typecheck`** and, for answer/search changes, `npm run eval`.

## Folder structure

```
backend/
  src/
    server.ts              app setup, routes, static /pdf, error handler
    config.ts              env vars + data paths (one place only)
    types/api.ts           TS types = docs/API_CONTRACT.md (keep identical)
    routes/
      health.ts  ask.ts  calculate.ts  rules.ts  eval.ts
    services/
      rulesStore.ts        load .jsonl once, clean headers, lookup by rule, alias map (17-a → 17)
      search.ts            keyword/BM25 search → top-k rules
      llm.ts               ONE wrapper for Anthropic/Cerebras (timeout, temp 0, JSON output)
      answer.ts            ask pipeline: detect lang → search → LLM → verify → build response
      verifyQuote.ts       check quote is a verbatim substring of the rule text
      calculator.ts        pure functions, read verified tables only
      amendments.ts        decide which amendment warnings apply
      strings.ts           fixed not_found + disclaimer strings (en/hi) from the contract
    data/
      tables/*.json        human-verified tables (setbacks, FAR, fees…)
      amendments.json      human-written amendment notes
  eval/
    questions.json         17 questions from sample_questions.md
    answer_key.json        expected status + rule numbers (filled by a HUMAN)
    run.ts                 eval runner
    results/latest.json    output, served by GET /api/eval/latest
  .env.example
```

Keep this structure. If you need a new file, put it in the matching folder.

## Data paths

- Read data from `../bhopal-impact-lab-2026-problem-statements-main/track-1-bhumi-vikas-sahayak/` resolved in `config.ts` with `path.resolve` relative to the backend folder (use `fileURLToPath(import.meta.url)`), not hard-coded `C:\...`.
- **Never write to or modify the source data folder.**
- Serve the PDFs: `/pdf/en.pdf` → `..._EN.pdf`, `/pdf/hi.pdf` → `..._HI.pdf`.

## The ask pipeline (must work like this)

1. Validate input with zod (1–1000 chars).
2. Detect language: any Devanagari char (`/[\u0900-\u097F]/`) → `hi`, else `en` (unless `lang` given).
3. If Hindi: make an English search query (glossary from `docs/DOMAIN_RULES.md` and/or a small LLM translate call).
4. Search top 6 rules (BM25 or keyword + title boost). Send only these rule texts to the LLM, each labelled with its rule number.
5. LLM prompt rules:
   - Use ONLY the given rule texts. If they do not answer → return `not_found`.
   - Return strict JSON: `{ "status": "answered"|"not_found", "answer": "...", "citations": [{ "rule": "56", "quote": "exact text" }] }`
   - Quotes must be copied word for word from the given text, short (one sentence or table row).
   - Answer in the question's language, max ~80 words, say "Rule X says…".
   - No legal advice language. No outside knowledge.
   - Temperature 0.
6. Parse JSON safely (if invalid → retry once → else `503 LLM_UNAVAILABLE`).
7. **Verify every quote** (`verifyQuote.ts`): normalise whitespace + strip page headers on both sides, then substring check. Drop failed quotes. Drop citations whose rule was not in the retrieved set.
8. No verified citation left → `not_found` with the fixed string.
9. Fill `title`, `part`, pages, `pdf_url` from `rulesStore` — **never from the LLM**.
10. Add `version` (with amendment warnings from `amendments.ts`) and `disclaimer`.

## Calculator rules

- Pure functions, no LLM, no network.
- Values only from `src/data/tables/*.json`. Each table entry must have:
  ```json
  { "source": { "rule": "56", "page": 78 }, "verified_by": "name or null", "verified_on": "2026-10-11 or null" }
  ```
- If `verified_by` is `null` → return `status: "manual_check"`, `value: null`.
- Inputs outside the table ranges → `manual_check` with a clear note. Do not extrapolate.
- **You (the AI) must never type table numbers from memory.** You may create the JSON skeleton and parse candidate values from the extracted text, but leave `verified_by: null`. A human checks against the PDF and fills it in.
- Write small unit checks for the calculator (plain asserts or `node:test`) when you touch it.

## LLM wrapper rules (`llm.ts`)

- Provider from `LLM_PROVIDER`, model from env (`ANTHROPIC_MODEL` / `CEREBRAS_MODEL`). Do not hard-code model names elsewhere.
- Timeout 30 s. On missing key → `/api/health` shows `llm: "missing_key"` and `/api/ask` returns `503 LLM_UNAVAILABLE`.
- Never log API keys or full prompts with keys. Log only: route, latency, status.
- Only `llm.ts` talks to the LLM. Other files call `llm.ts`.

## API rules

- Responses must match `docs/API_CONTRACT.md` exactly (names, types, `snake_case`). Keep `src/types/api.ts` identical to the contract.
- One central error handler → `{ error: { code, message } }`. No stack traces to the client.
- CORS allow `http://localhost:5173` only.
- Do not add endpoints not in the contract. Planned ones (`/api/precheck`) need a contract bump first.

## Eval rules

- `eval/questions.json` = the 17 questions from `sample_questions.md` with ids 1–17.
- `eval/answer_key.json` is filled by a **human** from the PDF. If empty, the eval reports "no answer key" — do not invent one.
- Pass = status matches AND (for answered) at least one expected rule is in the cited rules.
- **Never special-case sample questions in code** to pass the eval.

## Code style

- Small files, small functions, clear names. `async/await`, no callbacks.
- No `any` unless unavoidable (comment why).
- Comments only where the logic is not obvious.
- No dead code, no commented-out blocks.

## When you finish a task

Update `backend/MEMORY.md` (status, what changed, next steps, known issues, requests for frontend).
