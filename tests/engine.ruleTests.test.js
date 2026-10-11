import { describe, expect, it } from 'vitest';
import { ENGINE_READY, evaluateCheck } from '../src/engine/index.js';
import { readEncodedRuleFiles, readRuleTestFile } from '../src/services/encodedRulesStore.js';

// Runs every seed test case through the engine in test mode (verification gate off).
// Switched on when src/engine/index.js sets ENGINE_READY = true.

const rules = readEncodedRuleFiles();

describe.skipIf(!ENGINE_READY)('engine — seed rule tests', () => {
  for (const definition of rules) {
    const runtime = { rule_id: definition.rule_id, version: 1, definition, verification: definition.verification, test_status: 'not_run' };
    describe(definition.rule_id, () => {
      for (const t of readRuleTestFile(definition.rule_id)) {
        it(`${t.check_key}: ${t.name}`, () => {
          const check = definition.checks.find((c) => c.check_key === t.check_key);
          const finding = evaluateCheck(runtime, check, t.inputs, { testMode: true });
          if (t.expected.status === 'not_applicable') {
            expect(finding).toBeNull();
            return;
          }
          expect(finding).not.toBeNull();
          expect(finding.status).toBe(t.expected.status);
          if ('required_value' in t.expected) expect(finding.required_value).toBe(t.expected.required_value);
          if ('calculated_value' in t.expected) expect(finding.calculated_value ?? null).toBe(t.expected.calculated_value);
          expect(finding.evidence.length).toBeGreaterThan(0);
          expect(finding.evidence.every((e) => e.quote_verified)).toBe(true);
        });
      }
    });
  }
});

describe('engine status', () => {
  it('reports whether the engine is implemented', () => {
    expect(typeof ENGINE_READY).toBe('boolean');
  });
});
