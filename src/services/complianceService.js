import crypto from 'node:crypto';
import { evaluateCase } from '../engine/index.js';
import { applicationsRepository, complianceRepository } from '../repositories/applicationsRepository.js';
import { encodedRulesRepository } from '../repositories/encodedRulesRepository.js';

export const complianceService = {
  async runComplianceCheck({ inputs, application_id, rule_ids, test_mode, lang }) {
    let rules = encodedRulesRepository.getAllEncodedRules();
    if (Array.isArray(rule_ids) && rule_ids.length > 0) {
      rules = rules.filter((r) => rule_ids.includes(r.rule_id));
    }

    const evaluation = evaluateCase(inputs, rules, { testMode: Boolean(test_mode), lang });
    const checkRunId = crypto.randomUUID();
    const runAt = new Date().toISOString();

    const fullResult = {
      check_run_id: checkRunId,
      application_id: application_id || null,
      run_at: runAt,
      inputs,
      ...evaluation,
    };

    await complianceRepository.saveCheck(fullResult);

    if (application_id) {
      await applicationsRepository.update(application_id, {
        latest_check_id: checkRunId,
        latest_summary: evaluation.summary,
      });
    }

    return fullResult;
  },
};
