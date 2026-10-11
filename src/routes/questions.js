import { Router } from 'express';
import { questionsController } from '../controllers/questionsController.js';

export const questionsRouter = Router();

// §3 — F1, F2, F6, F7
questionsRouter.post('/questions', questionsController.askQuestion);
