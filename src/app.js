import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/index.js';
import { applicationsRouter } from './routes/applications.js';
import { complianceRouter } from './routes/compliance.js';
import { encodedRulesRouter } from './routes/encodedRules.js';
import { evalAndMetricsRouter } from './routes/evalAndMetrics.js';
import { questionsRouter } from './routes/questions.js';
import { rulesRouter } from './routes/rules.js';
import { systemRouter } from './routes/system.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '200kb' }));
  app.use(requestLogger);

  const api = express.Router();
  api.use(systemRouter);
  api.use(rulesRouter);
  api.use(questionsRouter);
  api.use(complianceRouter);
  api.use(applicationsRouter);
  api.use(encodedRulesRouter);
  api.use(evalAndMetricsRouter);
  app.use('/api', api);

  // §24 — official PDFs, opened by the frontend at #page=N
  app.get('/pdf/en.pdf', (_req, res) => res.type('application/pdf').sendFile(config.paths.pdfEn));
  app.get('/pdf/hi.pdf', (_req, res) => res.type('application/pdf').sendFile(config.paths.pdfHi));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
