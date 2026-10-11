import { runRuleTests } from '../engine/index.js';
import { encodedRulesRepository } from '../repositories/encodedRulesRepository.js';
import { getEncodedRule, readRuleTestFile, toSummary } from '../services/encodedRulesStore.js';
import { HttpError } from '../utils/httpError.js';
import { ruleIdParamSchema } from '../validation/schemas.js';

function findRuleOr404(ruleId) {
  const rule = getEncodedRule(ruleId);
  if (!rule) throw new HttpError(404, 'ENCODED_RULE_NOT_FOUND', `Encoded rule ${ruleId} not found.`);
  return rule;
}

export const encodedRulesController = {
  listEncodedRules(_req, res, next) {
    try {
      const source = encodedRulesRepository.getSource();
      const rules = encodedRulesRepository.getAllEncodedRules().map(toSummary);
      return res.json({ source: source === 'mongo' ? 'mongo' : 'files', rules });
    } catch (err) {
      return next(err);
    }
  },

  getEncodedRuleById(req, res, next) {
    try {
      const { rule_id } = ruleIdParamSchema.parse(req.params);
      const rule = findRuleOr404(rule_id);
      return res.json({ rule: { ...rule.definition, ...toSummary(rule) } });
    } catch (err) {
      return next(err);
    }
  },

  getRuleTests(req, res, next) {
    try {
      const { rule_id } = ruleIdParamSchema.parse(req.params);
      findRuleOr404(rule_id);
      const tests = readRuleTestFile(rule_id);
      return res.json({ rule_id, count: tests.length, tests });
    } catch (err) {
      return next(err);
    }
  },

  runRuleTestsForOne(req, res, next) {
    try {
      const { rule_id } = ruleIdParamSchema.parse(req.params);
      const rule = findRuleOr404(rule_id);
      const tests = readRuleTestFile(rule_id);
      const results = runRuleTests(rule, tests);
      return res.json({
        rule_id,
        ...results,
        all_passed: results.failed === 0,
      });
    } catch (err) {
      return next(err);
    }
  },

  runAllRuleTests(_req, res, next) {
    try {
      const allRules = encodedRulesRepository.getAllEncodedRules();
      const summaries = [];
      let totalPassed = 0;
      let totalFailed = 0;

      for (const r of allRules) {
        const tests = readRuleTestFile(r.rule_id);
        const resObj = runRuleTests(r, tests);
        totalPassed += resObj.passed;
        totalFailed += resObj.failed;
        summaries.push({
          rule_id: r.rule_id,
          total: resObj.total,
          passed: resObj.passed,
          failed: resObj.failed,
          pass: resObj.failed === 0,
        });
      }

      return res.json({
        total_tests: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        all_passed: totalFailed === 0,
        rules: summaries,
      });
    } catch (err) {
      return next(err);
    }
  },
};
