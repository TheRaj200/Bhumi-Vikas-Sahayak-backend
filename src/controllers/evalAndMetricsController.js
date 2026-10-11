import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';
import { lookupTimingCreateSchema } from '../validation/schemas.js';

const timingsMemory = [];

export const evalAndMetricsController = {
  getLatestEval(_req, res, next) {
    try {
      const file = path.join(config.paths.evalDir, 'results', 'latest.json');
      if (!fs.existsSync(file)) {
        throw new HttpError(404, 'NO_EVAL', 'No benchmark run yet. Run `npm run eval` in backend/.');
      }
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  recordTiming(req, res, next) {
    try {
      const data = lookupTimingCreateSchema.parse(req.body);
      const record = { ...data, created_at: new Date().toISOString() };
      timingsMemory.push(record);
      return res.status(201).json(record);
    } catch (err) {
      return next(err);
    }
  },

  getTimingsSummary(_req, res, next) {
    try {
      const manual = timingsMemory.filter((t) => t.mode === 'manual');
      const assisted = timingsMemory.filter((t) => t.mode === 'assisted');

      const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b.duration_ms, 0) / arr.length : 0);

      return res.json({
        total_trials: timingsMemory.length,
        manual: {
          count: manual.length,
          avg_duration_ms: Math.round(avg(manual)),
        },
        assisted: {
          count: assisted.length,
          avg_duration_ms: Math.round(avg(assisted)),
        },
        time_saved_pct: manual.length && assisted.length && avg(manual) > 0
          ? Math.round(((avg(manual) - avg(assisted)) / avg(manual)) * 100)
          : null,
      });
    } catch (err) {
      return next(err);
    }
  },
};
