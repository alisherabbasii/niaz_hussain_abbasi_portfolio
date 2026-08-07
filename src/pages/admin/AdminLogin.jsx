import { useId, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, Loader2, LogIn, ShieldCheck, WifiOff } from 'lucide-react';
import { useAuth } from '../../features/admin/useAuth';
import { isHttpError, isNetworkError } from '../../api/httpError';
import { useDocumentTitle } from '../../utils/useDocumentTitle';
import { PasswordInput } from '../../components/ui';

// Generic on purpose: never confirm or deny that a given email is registered.
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';

function messageForError(error) {
  if (isHttpError(error)) {
    if (error.status === 401 && error.data?.code === 'ACCOUNT_INACTIVE') {
      return 'This account is inactive. Contact the site owner for access.';
    }
    if (error.status === 401) return INVALID_CREDENTIALS_MESSAGE;
    if (error.status === 422) return 'Enter a valid email and password.';
    return error.message || 'Something went wrong. Please try again.';
  }
  if (isNetworkError(error)) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Standalone `/admin/login` screen — deliberately outside both SiteLayout
 * (no public nav/footer) and AdminLayout (no sidebar/topbar for a user who
 * isn't authenticated yet). Full viewport, no shared chrome.
 */
const AdminLogin = () => {
  const { login, status, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle('Admin Portal — Sign in');

  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isNetworkFailure, setIsNetworkFailure] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Already have a valid session (e.g. back button after logging in) — skip the form.
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsNetworkFailure(false);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(messageForError(err));
      setIsNetworkFailure(isNetworkError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Branding panel — hidden on small screens to keep the form front and center on mobile. */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-white px-16 py-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <p className="font-heading text-2xl font-bold tracking-tight">
            Niaz<span className="text-accent">Hussain.</span>
          </p>
        </div>
        <div className="relative max-w-sm">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-3 leading-tight">
            Admin Portal
          </h1>
          <p className="text-slate-300 font-light leading-relaxed text-sm">
            Content management tools for the civil engineering practice site — blog publishing,
            media, and site settings in one place.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Niaz Hussain Abbasi. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="font-heading text-xl font-bold tracking-tight text-primary mb-1">
              Niaz<span className="text-accent-strong">Hussain.</span>
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Admin Portal</p>
          </div>

          <div className="hidden lg:block mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong mb-2">Admin Portal</p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">Sign in to continue</h2>
          </div>

          {sessionExpired && !error && (
            <p
              className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5"
              role="status"
            >
              <Info size={15} className="shrink-0" aria-hidden="true" />
              Your session expired. Please sign in again.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor={emailId} className="field-label">
                Email
              </label>
              <input
                id={emailId}
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                disabled={submitting}
                aria-invalid={error ? 'true' : undefined}
              />
            </div>

            <PasswordInput
              id={passwordId}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
              aria-invalid={error ? 'true' : undefined}
            />

            {error && (
              <p
                className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3"
                role="alert"
              >
                {isNetworkFailure ? (
                  <WifiOff size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                )}
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} className="shrink-0" aria-hidden="true" />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
