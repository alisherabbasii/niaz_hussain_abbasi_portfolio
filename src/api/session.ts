/**
 * Pub/sub for "the current admin session just became invalid". `client.ts`
 * publishes on any 401 response (other than the login/session-check calls
 * themselves, where a 401 is an expected, non-exceptional outcome). Nothing
 * in `src/api` subscribes to this itself — it exists so a future UI layer
 * can react (e.g. redirect to the login page) without every service having
 * to know about routing.
 */

type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

/** Subscribe to session-expired notifications. Returns an unsubscribe function. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionExpired(): void {
  for (const listener of listeners) {
    listener();
  }
}
