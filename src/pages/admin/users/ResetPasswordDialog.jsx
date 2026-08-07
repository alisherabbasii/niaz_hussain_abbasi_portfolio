import { useId, useState } from 'react';
import { AlertTriangle, KeyRound } from 'lucide-react';
import { Modal, Button, PasswordInput } from '../../../components/ui';
import { resetUserPassword } from '../../../api/userService';
import { isHttpError } from '../../../api/httpError';

const MIN_LENGTH = 10;

function validate(password, confirmation) {
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters long.`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  if (password !== confirmation) return 'Passwords do not match.';
  return '';
}

/** Quick "reset another admin's password" action from the users list row — no current password needed since the actor is already an authenticated super_admin. */
export default function ResetPasswordDialog({ user, onClose, onSuccess }) {
  const passwordId = useId();
  const confirmId = useId();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever the target user changes (adjusting state during
  // render, per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes,
  // rather than a setState-in-effect that would trigger an extra render pass).
  const [lastUserId, setLastUserId] = useState(user?.id ?? null);
  if ((user?.id ?? null) !== lastUserId) {
    setLastUserId(user?.id ?? null);
    setPassword('');
    setConfirmation('');
    setError('');
  }

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await resetUserPassword(user.id, password, confirmation);
      onSuccess(user.full_name);
    } catch (err) {
      setError(isHttpError(err) ? err.message : 'Could not reset the password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Reset password — ${user.full_name}`} className="max-w-md">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-strong flex items-center justify-center shrink-0">
          <KeyRound size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary mb-1 pr-6">Reset password</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Set a new password for <span className="font-semibold text-primary">{user.full_name}</span>. They'll
            need to sign in with it next time.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordInput
          id={passwordId}
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint="At least 10 characters, with a letter and a number."
          disabled={submitting}
          required
        />
        <PasswordInput
          id={confirmId}
          label="Confirm new password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="new-password"
          disabled={submitting}
          required
        />

        {error && (
          <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
