import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { isDbConnected } from '../db/connect.js';
import { EncodedRule } from '../models/index.js';
import { encodedRuleSchema, ruleTestFileSchema } from '../rules/schema.js';

// Runtime source of encoded rules. MongoDB (with human verification status) when connected,
// otherwise the JSON files (always unverified → engine returns manual_review).

const state = { source: 'files', rules: new Map() };

/** sha256 of the definition without `verification` — changes when a rule's logic or data changes. */
export function definitionHash(definition) {
  // eslint-disable-next-line no-unused-vars
  const { verification, ...rest } = definition;
  return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
}

export function readEncodedRuleFiles() {
  return fs
    .readdirSync(config.paths.encodedRulesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => encodedRuleSchema.parse(JSON.parse(fs.readFileSync(path.join(config.paths.encodedRulesDir, f), 'utf8'))));
}

export function readRuleTestFile(ruleId) {
  const file = path.join(config.paths.ruleTestsDir, `${ruleId}.tests.json`);
  if (!fs.existsSync(file)) return [];
  return ruleTestFileSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function fromFile(def) {
  return {
    rule_id: def.rule_id,
    version: 1,
    definition: def,
    verification: def.verification,
    test_status: 'not_run',
    tests_total: readRuleTestFile(def.rule_id).length,
    tests_passed: 0,
  };
}

function fromDoc(doc) {
  return {
    rule_id: doc.rule_id,
    version: doc.version,
    definition: doc.definition,
    verification: doc.verification,
    test_status: doc.test_status,
    tests_total: doc.tests_total,
    tests_passed: doc.tests_passed,
  };
}

export async function loadEncodedRules() {
  let rules = [];
  if (isDbConnected()) {
    const docs = await EncodedRule.find().lean();
    if (docs.length > 0) {
      rules = docs.map(fromDoc);
      state.source = 'mongo';
    }
  }
  if (rules.length === 0) {
    rules = readEncodedRuleFiles().map(fromFile);
    state.source = 'files';
  }
  state.rules = new Map(rules.map((r) => [r.rule_id, r]));
  return { count: state.rules.size, source: state.source };
}

export function encodedRulesSource() {
  return state.source;
}

export function listEncodedRules() {
  return [...state.rules.values()];
}

export function getEncodedRule(ruleId) {
  return state.rules.get(ruleId) ?? null;
}

export function isEnabledForChecks(rule) {
  return rule.verification?.status === 'verified' && rule.test_status === 'passing';
}

/** EncodedRuleSummary from docs/API_CONTRACT.md §14. */
export function toSummary(rule) {
  const d = rule.definition;
  return {
    rule_id: rule.rule_id,
    rule_ref: d.rule_ref,
    title_en: d.title_en,
    title_hi: d.title_hi,
    topic: d.topic,
    version: rule.version,
    verification: rule.verification,
    test_status: rule.test_status,
    tests_total: rule.tests_total,
    tests_passed: rule.tests_passed,
    enabled_for_checks: isEnabledForChecks(rule),
    checks: d.checks.map((c) => ({ check_key: c.check_key, kind: c.kind, title_en: c.title_en, title_hi: c.title_hi })),
  };
}

/** Encoded rule ids that point at a printed rule number (for /api/rules responses). */
export function encodedIdsForRule(ruleNumber) {
  const key = String(ruleNumber).toLowerCase();
  return listEncodedRules()
    .filter((r) => r.definition.parent_rule.toLowerCase() === key || r.definition.rule_ref.toLowerCase() === key)
    .map((r) => r.rule_id);
}
