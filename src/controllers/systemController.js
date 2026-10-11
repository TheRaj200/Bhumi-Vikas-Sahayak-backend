import { config, isLlmConfigured } from '../config.js';
import { STATUS_META } from '../constants/statuses.js';
import { STRINGS } from '../constants/strings.js';
import { dbStatus } from '../db/connect.js';
import { encodedRulesRepository } from '../repositories/encodedRulesRepository.js';
import { rulesRepository } from '../repositories/rulesRepository.js';
import { allAmendmentWarnings } from '../services/versionInfo.js';

export const systemController = {
  getHealth(_req, res) {
    try {
      const rules = rulesRepository.getRulesInfo();
      return res.json({
        ok: true,
        contract_version: config.contractVersion,
        rules_loaded: rules.count,
        rules_source: rules.source,
        encoded_rules_loaded: encodedRulesRepository.getAllEncodedRules().length,
        encoded_rules_source: encodedRulesRepository.getSource(),
        db: dbStatus(),
        llm: isLlmConfigured() ? 'configured' : 'missing_key',
      });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message } });
    }
  },

  getMeta(_req, res) {
    try {
      return res.json({
        app_name: 'Bhumi Vikas Sahayak',
        contract_version: config.contractVersion,
        version: {
          rules_source: config.rulesSource,
          consolidated_to: config.sourceVersion,
          amendment_warnings: allAmendmentWarnings(),
        },
        statuses: STATUS_META,
        disclaimer_en: STRINGS.disclaimer.en,
        disclaimer_hi: STRINGS.disclaimer.hi,
        not_found_en: STRINGS.not_found.en,
        not_found_hi: STRINGS.not_found.hi,
      });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message } });
    }
  },
};
