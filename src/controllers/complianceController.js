import { complianceService } from '../services/complianceService.js';
import { complianceCheckRequestSchema } from '../validation/schemas.js';

export const complianceController = {
  async runCheck(req, res, next) {
    try {
      const parsed = complianceCheckRequestSchema.parse(req.body);
      const result = await complianceService.runComplianceCheck(parsed);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },
};
