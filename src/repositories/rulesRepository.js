import { getPages, getRule, listRules, quoteInRule, resolveRuleNumber, rulesInfo } from '../services/rulesStore.js';

export const rulesRepository = {
  getRulesInfo() {
    return rulesInfo();
  },

  getAllRules() {
    return listRules();
  },

  findRuleByNumber(ruleNumber) {
    return getRule(ruleNumber);
  },

  resolveAlias(ruleNumber) {
    return resolveRuleNumber(ruleNumber);
  },

  checkQuoteInRule(ruleNumber, quote) {
    return quoteInRule(ruleNumber, quote);
  },

  getAllPages() {
    return getPages();
  },
};
