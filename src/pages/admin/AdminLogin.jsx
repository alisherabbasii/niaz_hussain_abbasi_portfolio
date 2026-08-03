import { useState } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { Container, PageSection, Button, Input, Badge } from '../../components/ui';
import { checkCredentials } from '../../features/admin/auth';

const AdminLogin = ({ onUnlock }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkCredentials(username, password)) {
      setError('');
      onUnlock();
    } else {
      setError('Incorrect username or password.');
    }
  };

  return (
    <PageSection center>
      <Container className="max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">Admin</h1>
          <Badge variant="warning" size="sm">Not real security</Badge>
        </div>
        <p className="text-slate-500 font-light mb-8 text-sm leading-relaxed">
          This site has no backend — the check below runs entirely in your browser against a
          hardcoded value shipped in the JS bundle. It keeps casual visitors out, nothing more.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-600" role="alert">
              <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <Button type="submit" icon={LogIn} fullWidth>
            Log in
          </Button>
        </form>
      </Container>
    </PageSection>
  );
};

export default AdminLogin;
