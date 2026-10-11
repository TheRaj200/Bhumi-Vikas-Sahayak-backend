export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} code  one of ApiError codes in docs/API_CONTRACT.md
   * @param {string} message  safe to show to the user
   * @param {{ field: string, message: string }[]} [details]
   */
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notImplemented(endpoint, contractSection) {
  return new HttpError(
    501,
    'NOT_IMPLEMENTED',
    `Not implemented yet: ${endpoint}. See docs/API_CONTRACT.md ${contractSection}.`,
  );
}

export function dbUnavailable() {
  return new HttpError(503, 'DB_UNAVAILABLE', 'Database is not connected. Set MONGODB_URI in backend/.env and restart.');
}
