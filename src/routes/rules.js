import { Router } from 'express';
import { rulesController } from '../controllers/rulesController.js';

export const rulesRouter = Router();

// §4 — keyword/BM25 search. Must be registered before /rules/:rule.
rulesRouter.get('/rules/search', rulesController.searchRules);

// §5
rulesRouter.get('/rules', rulesController.listRules);

// §6
rulesRouter.get('/rules/:rule', rulesController.getRuleByNumber);
