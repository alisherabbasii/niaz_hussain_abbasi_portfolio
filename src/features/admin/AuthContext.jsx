import { useCallback, useEffect, useState } from 'react';
import { getCurrentSession, login as loginRequest, logout as logoutRequest, onSessionExpired } from '../../api/authService';
import { AuthContext } from './authContextObject';

/**
 * Backs `/admin`: checks the real PHP session on mount (`GET /auth/me.php`)
 * rather than trusting any client-side flag, and reacts to `apiClient`'s
 * global "session just expired" event (any background 401) so a session
 * that dies mid-use gets reflected in the UI instead of silently failing.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentSession()
      .then((result) => {
        if (cancelled) return;
        setAdmin(result);
        setStatus(result ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setAdmin(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        setAdmin(null);
        setStatus('unauthenticated');
        setSessionExpired(true);
      }),
    [],
  );

  const login = useCallback(async (email, password) => {
    const result = await loginRequest(email, password);
    setAdmin(result);
    setStatus('authenticated');
    setSessionExpired(false);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAdmin(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, status, sessionExpired, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
