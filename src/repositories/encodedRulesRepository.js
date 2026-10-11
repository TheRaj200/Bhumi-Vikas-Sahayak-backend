import { encodedIdsForRule, encodedRulesSource, getEncodedRule, listEncodedRules } from '../services/encodedRulesStore.js';

export const encodedRulesRepository = {
  getAllEncodedRules() {
    return listEncodedRules();
  },

  getEncodedRuleById(ruleId) {
    return getEncodedRule(ruleId);
  },

  getEncodedIdsForRule(ruleNumber) {
    return encodedIdsForRule(ruleNumber);
  },

  getSource() {
    return encodedRulesSource();
  },
};
