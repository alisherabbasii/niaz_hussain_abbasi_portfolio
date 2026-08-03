import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, LogIn } from 'lucide-react';
import { Container, PageSection, Button, Input } from '../../components/ui';
import { useAuth } from '../../features/admin/useAuth';
import { isHttpError, isNetworkError } from '../../api/httpError';

function messageForError(error) {
  if (isHttpError(error)) {
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 422) return 'Enter a valid email and password.';
    return error.message || 'Something went wrong. Please try again.';
  }
  if (isNetworkError(error)) return error.message;
  return 'Something went wrong. Please try again.';
}

const AdminLogin = () => {
  const { login, status, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already have a valid session (e.g. back button after logging in) — skip the form.
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(messageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageSection center>
      <Container className="max-w-md">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight mb-2">Admin Login</h1>
        <p className="text-slate-500 font-light mb-8 text-sm leading-relaxed">
          Sign in with your admin account to access the content tools.
        </p>

        {sessionExpired && !error && (
          <p
            className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5"
            role="status"
          >
            <Info size={15} className="shrink-0" aria-hidden="true" />
            Your session expired. Please log in again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            disabled={submitting}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={submitting}
          />

          {error && (
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-600" role="alert">
              <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <Button type="submit" icon={LogIn} fullWidth disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Container>
    </PageSection>
  );
};

export default AdminLogin;
