import { answerService } from '../services/answerService.js';
import { questionRequestSchema } from '../validation/schemas.js';

export const questionsController = {
  async askQuestion(req, res, next) {
    try {
      const parsed = questionRequestSchema.parse(req.body);
      const result = await answerService.answerQuestion(parsed);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },
};
