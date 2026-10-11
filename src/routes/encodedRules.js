import { Router } from 'express';
import { encodedRulesController } from '../controllers/encodedRulesController.js';
import { notImplemented } from '../utils/httpError.js';
import { ruleIdParamSchema, verificationRequestSchema } from '../validation/schemas.js';

export const encodedRulesRouter = Router();

// §14
encodedRulesRouter.get('/encoded-rules', encodedRulesController.listEncodedRules);

// §15
encodedRulesRouter.get('/encoded-rules/:rule_id', encodedRulesController.getEncodedRuleById);

// §16 — human action only
encodedRulesRouter.patch('/encoded-rules/:rule_id/verification', (req, _res) => {
  ruleIdParamSchema.parse(req.params);
  verificationRequestSchema.parse(req.body);
  throw notImplemented('PATCH /api/encoded-rules/:rule_id/verification', 'Human verification only');
});

// §17
encodedRulesRouter.get('/encoded-rules/:rule_id/tests', encodedRulesController.getRuleTests);

// §18 — create test
encodedRulesRouter.post('/encoded-rules/:rule_id/tests', (req, _res) => {
  ruleIdParamSchema.parse(req.params);
  throw notImplemented('POST /api/encoded-rules/:rule_id/tests', '§18');
});

// §19
encodedRulesRouter.post('/encoded-rules/:rule_id/tests/run', encodedRulesController.runRuleTestsForOne);

// §20
encodedRulesRouter.post('/rule-tests/run', encodedRulesController.runAllRuleTests);
