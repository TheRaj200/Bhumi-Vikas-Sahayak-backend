import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { config } from '../src/config.js';
import { encodedRuleSchema, ruleTestFileSchema } from '../src/rules/schema.js';
import { findQuotePage, getRule, quoteInRule } from '../src/services/rulesStore.js';

const ruleFiles = fs.readdirSync(config.paths.encodedRulesDir).filter((f) => f.endsWith('.json'));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Every { quote, page } an encoded rule relies on, with the page it claims. */
function collectQuotes(rule) {
  const out = [];
  const add = (where, quote, page) => out.push({ where, quote, page });
  const walkParams = (node, where, params, fallbackPage) => {
    if (Array.isArray(node)) {
      node.forEach((n, i) => walkParams(n, `${where}[${i}]`, params, fallbackPage));
    } else if (node && typeof node === 'object') {
      if (typeof node.quote === 'string') {
        add(where, node.quote, node.page ?? params.slab_page ?? params.page ?? fallbackPage);
      }
      for (const [k, v] of Object.entries(node)) {
        if (k !== 'quote') walkParams(v, `${where}.${k}`, params, fallbackPage);
      }
    }
  };

  for (const check of rule.checks) {
    const at = `${rule.rule_id}.${check.check_key}`;
    add(`${at}.source`, check.source.quote, check.source.page);
    (check.extra_quotes ?? []).forEach((q, i) => add(`${at}.extra_quotes[${i}]`, q.quote, q.page));
    check.exceptions.forEach((e) => e.quote && add(`${at}.exception.${e.id}`, e.quote, e.page ?? check.source.page));
    if (check.logic.type === 'range_table') {
      check.logic.rows.forEach((r, i) => r.quote && add(`${at}.rows[${i}]`, r.quote, r.page ?? check.source.page));
    }
    if (check.logic.type === 'formula') {
      walkParams(check.logic.params, `${at}.params`, check.logic.params, check.source.page);
    }
  }
  for (const [name, table] of Object.entries(rule.tables ?? {})) {
    table.rows.forEach((r, i) => r.quote && add(`${rule.rule_id}.tables.${name}[${i}]`, r.quote, r.page));
  }
  return out;
}

describe('encoded rule files', () => {
  it('has the agreed encoded rules', () => {
    expect(ruleFiles.length).toBeGreaterThanOrEqual(11);
  });

  for (const file of ruleFiles) {
    describe(file, () => {
      const rule = readJson(path.join(config.paths.encodedRulesDir, file));

      it('matches the schema', () => {
        const result = encodedRuleSchema.safeParse(rule);
        if (!result.success) throw new Error(JSON.stringify(result.error.issues, null, 2));
      });

      it('file name equals rule_id', () => {
        expect(file).toBe(`${rule.rule_id}.json`);
      });

      it('ships unverified (only a human verifies, via the API)', () => {
        expect(rule.verification.status).toBe('unverified');
        expect(rule.verification.verified_by).toBeNull();
      });

      it('parent rule exists in the dataset', () => {
        expect(getRule(rule.parent_rule)).not.toBeNull();
      });

      for (const q of collectQuotes(rule)) {
        it(`quote exists in rule ${rule.parent_rule} on page ${q.page}: ${q.where}`, () => {
          expect(quoteInRule(rule.parent_rule, q.quote), `not found in rule text: "${q.quote}"`).toBe(true);
          expect(findQuotePage(q.quote, rule.parent_rule)).toBe(q.page);
        });
      }
    });
  }
});

describe('rule test files', () => {
  const testsDir = config.paths.ruleTestsDir;
  const testFiles = fs.existsSync(testsDir) ? fs.readdirSync(testsDir).filter((f) => f.endsWith('.tests.json')) : [];
  const rulesById = new Map(ruleFiles.map((f) => {
    const r = readJson(path.join(config.paths.encodedRulesDir, f));
    return [r.rule_id, r];
  }));

  it('every encoded rule has a test file', () => {
    for (const ruleId of rulesById.keys()) {
      expect(testFiles, `missing ${ruleId}.tests.json`).toContain(`${ruleId}.tests.json`);
    }
  });

  for (const file of testFiles) {
    describe(file, () => {
      const ruleId = file.replace('.tests.json', '');
      const tests = readJson(path.join(testsDir, file));
      const rule = rulesById.get(ruleId);

      it('matches the schema and refers to real checks', () => {
        const result = ruleTestFileSchema.safeParse(tests);
        if (!result.success) throw new Error(JSON.stringify(result.error.issues, null, 2));
        expect(rule, `no encoded rule ${ruleId}`).toBeDefined();
        const keys = new Set(rule.checks.map((c) => c.check_key));
        for (const t of tests) expect(keys, `unknown check_key ${t.check_key}`).toContain(t.check_key);
      });

      it('test names are unique', () => {
        const names = tests.map((t) => t.name);
        expect(new Set(names).size).toBe(names.length);
      });

      it('covers normal, boundary and missing-input cases (and exceptions when the rule has them)', () => {
        const kinds = new Set(tests.map((t) => t.kind));
        expect(kinds).toContain('normal');
        expect(kinds).toContain('missing_input');
        const hasNumericLogic = rule.checks.some((c) => ['range_table', 'constant', 'lookup', 'formula'].includes(c.logic.type) || '$ref_table' in c.logic);
        if (hasNumericLogic) expect(kinds).toContain('boundary');
        const hasExceptions = rule.checks.some((c) => c.exceptions.some((e) => e.effect === 'manual_review'));
        if (hasExceptions) expect(kinds).toContain('exception');
      });
    });
  }
});
