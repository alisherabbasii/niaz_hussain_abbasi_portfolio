import { apiClient, hasCsrfToken } from './client';
import { HttpError } from './httpError';
import type { Admin } from './types';

export { onSessionExpired } from './session';

interface AdminEnvelope {
  admin: Admin;
}

/**
 * Session check: returns the logged-in admin, or `null` if there is no
 * active session. A 401 here is an expected, non-exceptional result (it's
 * how the frontend discovers "not logged in"), so it's swallowed rather
 * than thrown — every other error still propagates.
 *
 * Calling this also (re)issues the CSRF cookie server-side
 * (`backend/api/auth/me.php` always calls `csrf_ensure_token()`), so it
 * doubles as the app's session/CSRF bootstrap on first load.
 */
export async function getCurrentSession(): Promise<Admin | null> {
  try {
    const { data } = await apiClient.get<AdminEnvelope>('/auth/me.php');
    return data.admin;
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * `login.php` rejects the request with 403 unless a CSRF cookie already
 * exists for the session, so a login attempt with no prior request on the
 * page (fresh tab, no session-check yet) bootstraps one first via the same
 * session-check call `getCurrentSession()` makes.
 *
 * That priming call and this one both fire from the same click when the
 * cookie is missing, so there's still a window (slow network, a mount-time
 * `getCurrentSession()` from `AuthProvider` that hasn't landed yet) where
 * the token in hand goes stale between reading it and the server checking
 * it. Rather than surface that as an error and make the user click twice,
 * retry once with a freshly re-primed token — a real CSRF rejection is the
 * only way `login.php` returns 403, so it's always safe to retry here.
 */
export async function login(email: string, password: string): Promise<Admin> {
  if (!hasCsrfToken()) {
    await getCurrentSession();
  }

  try {
    const { data } = await apiClient.post<AdminEnvelope>('/auth/login.php', { email, password });
    return data.admin;
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 403) {
      throw error;
    }

    await getCurrentSession();
    const { data } = await apiClient.post<AdminEnvelope>('/auth/login.php', { email, password });
    return data.admin;
  }
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout.php');
}
