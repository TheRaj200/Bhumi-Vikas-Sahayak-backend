import { config } from '../config.js';
import { encodedRulesRepository } from '../repositories/encodedRulesRepository.js';
import { rulesRepository } from '../repositories/rulesRepository.js';
import { pdfUrl } from '../services/rulesStore.js';
import { searchService } from '../services/searchService.js';
import { HttpError } from '../utils/httpError.js';
import { searchQuerySchema } from '../validation/schemas.js';

export const rulesController = {
  searchRules(req, res, next) {
    try {
      const parsedQuery = searchQuerySchema.parse(req.query);
      const results = searchService.searchRules({
        q: parsedQuery.q,
        limit: parsedQuery.limit,
        part: parsedQuery.part,
      });
      return res.json(results);
    } catch (err) {
      return next(err);
    }
  },

  listRules(_req, res, next) {
    try {
      const rules = rulesRepository.getAllRules().map((r) => ({
        rule: r.rule,
        title: r.title,
        part: r.part,
        page_start: r.page_start,
        page_end: r.page_end,
        encoded_rule_ids: encodedRulesRepository.getEncodedIdsForRule(r.rule),
      }));
      return res.json({
        source_version: config.sourceVersion,
        rules,
      });
    } catch (err) {
      return next(err);
    }
  },

  getRuleByNumber(req, res, next) {
    try {
      const requested = String(req.params.rule);
      const record = rulesRepository.findRuleByNumber(requested);
      if (!record) {
        throw new HttpError(404, 'RULE_NOT_FOUND', `Rule ${requested} is not in the rulebook.`);
      }
      const isAlias = rulesRepository.resolveAlias(requested) !== requested.toLowerCase();
      return res.json({
        rule: isAlias ? requested : record.rule,
        parent_rule: record.rule,
        title: record.title,
        part: record.part,
        page_start: record.page_start,
        page_end: record.page_end,
        text: record.text_clean,
        pdf_url: pdfUrl(record.page_start),
        source_version: config.sourceVersion,
        encoded_rule_ids: [
          ...new Set([
            ...encodedRulesRepository.getEncodedIdsForRule(record.rule),
            ...(isAlias ? encodedRulesRepository.getEncodedIdsForRule(requested) : []),
          ]),
        ],
      });
    } catch (err) {
      return next(err);
    }
  },
};
