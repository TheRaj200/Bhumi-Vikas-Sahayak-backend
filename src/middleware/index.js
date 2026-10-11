import { ZodError } from 'zod';
import { isDbConnected } from '../db/connect.js';
import { dbUnavailable, HttpError } from '../utils/httpError.js';

/** Logs method, path, status and latency only — never bodies (no personal data, no keys). */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
}

export function requireDb(_req, _res, next) {
  if (!isDbConnected()) return next(dbUnavailable());
  next();
}

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Some inputs are invalid.',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof HttpError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.status).json(body);
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON.' } });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid id.' } });
  }
  console.error('[error]', err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } });
}
