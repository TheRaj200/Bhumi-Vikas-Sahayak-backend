import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Benchmark: sends the 17 sample questions to a RUNNING backend (POST /api/questions)
// and compares status + cited rules with the human answer key. Writes eval/results/latest.json
// (served by GET /api/eval/latest). Usage: start the server, then `npm run eval`.

const dir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.EVAL_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;

const questions = JSON.parse(fs.readFileSync(path.join(dir, 'questions.json'), 'utf8'));
const answerKey = JSON.parse(fs.readFileSync(path.join(dir, 'answer_key.json'), 'utf8'));
const keyById = new Map(answerKey.items.map((i) => [i.id, i]));
const answerKeyComplete = answerKey.items.every((i) => i.expected_status);

function judge(expected, gotStatus, gotRules) {
  if (!expected?.expected_status) return null;
  if (expected.expected_status !== gotStatus) return false;
  if (expected.expected_status === 'not_found') return true;
  return expected.expected_rules.length === 0 || expected.expected_rules.some((r) => gotRules.includes(r));
}

async function ask(q) {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: q.question, lang: q.lang }),
    });
    const body = await res.json();
    if (!res.ok) return { status: 'error', rules: [], latency: Date.now() - start, error: body?.error?.message };
    return { status: body.status, rules: [...new Set((body.evidence ?? []).map((e) => e.rule))], latency: body.latency_ms ?? Date.now() - start };
  } catch (err) {
    return { status: 'error', rules: [], latency: Date.now() - start, error: err.message };
  }
}

async function main() {
  if (!answerKeyComplete) console.warn('! eval/answer_key.json is not complete — unanswered items are reported with pass: null.');
  const items = [];
  for (const q of questions) {
    const got = await ask(q);
    const expected = keyById.get(q.id);
    const pass = judge(expected, got.status, got.rules);
    items.push({
      id: q.id,
      question: q.question,
      lang: q.lang,
      expected_status: expected?.expected_status ?? null,
      expected_rules: expected?.expected_rules ?? [],
      got_status: got.status,
      got_rules: got.rules,
      pass,
      latency_ms: got.latency,
    });
    console.log(`Q${q.id} ${pass === null ? '?' : pass ? 'PASS' : 'FAIL'} got=${got.status} rules=[${got.rules.join(', ')}]${got.error ? ` error=${got.error}` : ''}`);
  }
  const result = {
    run_at: new Date().toISOString(),
    total: items.length,
    passed: items.filter((i) => i.pass === true).length,
    answer_key_complete: answerKeyComplete,
    items,
  };
  fs.mkdirSync(path.join(dir, 'results'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'results', 'latest.json'), JSON.stringify(result, null, 2));
  console.log(`\n${result.passed}/${result.total} passed. Saved eval/results/latest.json`);
}

main();
