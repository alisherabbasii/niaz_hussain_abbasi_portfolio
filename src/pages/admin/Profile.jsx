import { useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, Save, UserCircle } from 'lucide-react';
import { Container, Button, Input, PasswordInput, Badge } from '../../components/ui';
import { useAuth } from '../../features/admin/useAuth';
import { updateProfile, changePassword } from '../../api/profileService';
import { ROLE_LABELS } from '../../features/admin/permissions';
import { isHttpError } from '../../api/httpError';
import { useDocumentTitle } from '../../utils/useDocumentTitle';

const PASSWORD_MIN_LENGTH = 10;

function validateNewPassword(password) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return '';
}

function initials(name) {
  if (!name) return '';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

/** `/admin/profile` — every authenticated admin, regardless of role, manages their own name/email/password here. Role itself is never editable from this screen. */
export default function Profile() {
  useDocumentTitle('Admin — Profile');
  const { admin, refreshAdmin } = useAuth();

  const nameId = useId();
  const emailId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [fullName, setFullName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError('Enter a valid email address.');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateProfile(fullName.trim(), email.trim());
      refreshAdmin(updated);
      setProfileSuccess('Profile updated.');
    } catch (err) {
      setProfileError(isHttpError(err) ? err.message : 'Could not update your profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    const validationError = validateNewPassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordSuccess('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        isHttpError(err) && err.status === 401
          ? 'Current password is incorrect.'
          : isHttpError(err)
            ? err.message
            : 'Could not change your password. Please try again.'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-strong/10 text-accent-strong flex items-center justify-center text-lg font-bold shrink-0">
            {initials(admin?.name)}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-1">Profile</h1>
            <Badge variant="outline" size="sm">{ROLE_LABELS[admin?.role] ?? admin?.role}</Badge>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} noValidate className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-5 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle size={17} className="text-accent-strong" aria-hidden="true" />
            <h2 className="font-bold text-primary">Account details</h2>
          </div>

          <Input
            id={nameId}
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={savingProfile}
            autoComplete="name"
            required
          />
          <Input
            id={emailId}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={savingProfile}
            autoComplete="email"
            required
          />

          {profileError && (
            <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-success/10 border border-success/20 rounded-xl px-4 py-3" role="status">
              <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
              {profileSuccess}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" icon={Save} iconPosition="leading" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} noValidate className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={17} className="text-accent-strong" aria-hidden="true" />
            <h2 className="font-bold text-primary">Change password</h2>
          </div>

          <PasswordInput
            id={currentPasswordId}
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={savingPassword}
            autoComplete="current-password"
            required
          />
          <div className="grid sm:grid-cols-2 gap-5">
            <PasswordInput
              id={newPasswordId}
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={savingPassword}
              autoComplete="new-password"
              hint="At least 10 characters, with a letter and a number."
              required
            />
            <PasswordInput
              id={confirmPasswordId}
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={savingPassword}
              autoComplete="new-password"
              required
            />
          </div>

          {passwordError && (
            <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-success/10 border border-success/20 rounded-xl px-4 py-3" role="status">
              <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
              {passwordSuccess}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" icon={KeyRound} iconPosition="leading" disabled={savingPassword}>
              {savingPassword ? 'Changing…' : 'Change password'}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
