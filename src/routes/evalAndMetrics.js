import { Router } from 'express';
import { evalAndMetricsController } from '../controllers/evalAndMetricsController.js';

export const evalAndMetricsRouter = Router();

// §21
evalAndMetricsRouter.get('/eval/latest', evalAndMetricsController.getLatestEval);

// §22
evalAndMetricsRouter.post('/metrics/lookup-timings', evalAndMetricsController.recordTiming);

// §23
evalAndMetricsRouter.get('/metrics/lookup-timings/summary', evalAndMetricsController.getTimingsSummary);
