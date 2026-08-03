import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { HttpError, NetworkError } from './httpError';
import { emitSessionExpired } from './session';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** Endpoints where a 401 is an expected outcome (bad credentials, "am I logged in?"), not a session that just expired mid-use. */
const SESSION_EXPIRY_EXEMPT_PATHS = ['/auth/login.php', '/auth/me.php'];

function readCookie(name: string): string | null {
  const pattern = new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&')}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Whether the CSRF cookie (set by any prior request via `csrf_ensure_token()`) is already present. */
export function hasCsrfToken(): boolean {
  return readCookie(CSRF_COOKIE_NAME) !== null;
}

function isSessionExpiryExempt(url: string | undefined): boolean {
  if (!url) return false;
  return SESSION_EXPIRY_EXEMPT_PATHS.some((path) => url.includes(path));
}

function extractErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Shared axios instance for every `src/api/*Service.ts` module. Same-origin,
 * cookie-based session auth (see `backend/helpers/Session.php`) — there is
 * no bearer token to attach, just `withCredentials` so the session and CSRF
 * cookies travel with each request.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toLowerCase() ?? 'get';

  if (MUTATING_METHODS.has(method)) {
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) {
      config.headers.set(CSRF_HEADER_NAME, token);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new NetworkError());
    }

    const { status, data } = error.response;

    if (status === 401 && !isSessionExpiryExempt(error.config?.url)) {
      emitSessionExpired();
    }

    return Promise.reject(new HttpError(extractErrorMessage(data), status, data));
  },
);
