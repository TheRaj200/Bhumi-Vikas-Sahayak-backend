import { Router } from 'express';
import { complianceController } from '../controllers/complianceController.js';

export const complianceRouter = Router();

// §7 — F4, F5, F6, F9, F10
complianceRouter.post('/compliance/check', complianceController.runCheck);
