import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEncodedRules } from '../src/services/encodedRulesStore.js';
import { loadRules } from '../src/services/rulesStore.js';

// Smoke tests for the scaffold. Runs without MongoDB and without an LLM key.

let server;
let base;

beforeAll(async () => {
  loadRules();
  await loadEncodedRules();
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
const post = (p, body) =>
  fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({
    status: r.status,
    body: await r.json(),
  }));

describe('API scaffold', () => {
  it('GET /api/health', async () => {
    const { status, body } = await get('/api/health');
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, contract_version: '2.0', rules_loaded: 106 });
    expect(['connected', 'disconnected', 'not_configured']).toContain(body.db);
  });

  it('GET /api/meta has version info and statuses', async () => {
    const { body } = await get('/api/meta');
    expect(body.version.consolidated_to).toBe('2025-03-06');
    expect(body.version.amendment_warnings[0].rule).toBe('2(5)(c)');
    expect(body.statuses.map((s) => s.key)).toContain('manual_review');
  });

  it('GET /api/rules/56 returns cleaned text and encoded ids', async () => {
    const { status, body } = await get('/api/rules/56');
    expect(status).toBe(200);
    expect(body.pdf_url).toBe('/pdf/en.pdf#page=77');
    expect(body.text).not.toMatch(/M\.P\. Bhumi Vikas Rules, 2012\s+78/);
    expect(body.encoded_rule_ids).toContain('R56_RESIDENTIAL_OPEN_SPACES');
  });

  it('GET /api/rules/17-a resolves to parent 17', async () => {
    const { body } = await get('/api/rules/17-a');
    expect(body).toMatchObject({ rule: '17-a', parent_rule: '17' });
    expect(body.encoded_rule_ids).toEqual(expect.arrayContaining(['R17_FARM_HOUSE', 'R17A_AGRI_TOURIST']));
  });

  it('GET /api/rules/999 → 404 RULE_NOT_FOUND', async () => {
    const { status, body } = await get('/api/rules/999');
    expect(status).toBe(404);
    expect(body.error.code).toBe('RULE_NOT_FOUND');
  });

  it('GET /api/encoded-rules lists all rules, none enabled', async () => {
    const { body } = await get('/api/encoded-rules');
    expect(body.rules.length).toBeGreaterThanOrEqual(11);
    expect(body.rules.every((r) => r.enabled_for_checks === false)).toBe(true);
  });

  it('POST /api/questions validates input', async () => {
    const { status, body } = await post('/api/questions', { question: '' });
    expect(status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/compliance/check rejects unknown fields', async () => {
    const { status } = await post('/api/compliance/check', { inputs: { plot_area: 200 } });
    expect(status).toBe(400);
  });

  it('unknown route → 404 NOT_FOUND', async () => {
    const { status, body } = await get('/api/nope');
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/rules/search returns relevant search hits', async () => {
    const { status, body } = await get('/api/rules/search?q=open+space');
    expect(status).toBe(200);
    expect(body.total_matches).toBeGreaterThan(0);
    expect(body.hits.some((h) => h.rule === '56')).toBe(true);
  });

  it('POST /api/questions handles valid query with evidence_only when no key', async () => {
    const { status, body } = await post('/api/questions', {
      question: 'How much open space do I leave in front for 9 m road?',
    });
    expect(status).toBe(200);
    expect(['answered', 'evidence_only']).toContain(body.status);
    expect(body.evidence.length).toBeGreaterThan(0);
  });

  it('POST /api/compliance/check evaluates case inputs and returns findings', async () => {
    const { status, body } = await post('/api/compliance/check', {
      inputs: {
        building_type: 'residential',
        road_width_m: 9,
        proposed: { building_height_m: 9, front_setback_m: 3.0 },
      },
      test_mode: true,
    });
    expect(status).toBe(200);
    expect(body.check_run_id).toBeDefined();
    expect(body.findings.length).toBeGreaterThan(0);
  });

  it('GET and POST /api/applications works in memory', async () => {
    const { status: listStatus, body: listBody } = await get('/api/applications');
    expect(listStatus).toBe(200);
    expect(Array.isArray(listBody.applications)).toBe(true);

    const { status: createStatus, body: createBody } = await post('/api/applications', {
      title: 'Test House',
      inputs: { plot_area_sqm: 200 },
    });
    expect(createStatus).toBe(201);
    expect(createBody.title).toBe('Test House');
  });
});
