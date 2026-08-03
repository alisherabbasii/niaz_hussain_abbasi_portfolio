/**
 * Normalized error types every service in `src/api` rejects with, so calling
 * code never has to branch on axios internals directly.
 */

/** The server responded, but with a non-2xx status. Mirrors `{ error: string }` from `Response.php::json_response`. */
export class HttpError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

/** The request never reached the server (offline, DNS failure, CORS, timeout). */
export class NetworkError extends Error {
  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
