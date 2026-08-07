import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Save, UserPlus } from 'lucide-react';
import { Container, Button, Input, PasswordInput } from '../../../components/ui';
import { getUserById, createUser, updateUser } from '../../../api/userService';
import { useAuth } from '../../../features/admin/useAuth';
import { ROLES, ROLE_LABELS, isSuperAdmin } from '../../../features/admin/permissions';
import { isHttpError } from '../../../api/httpError';
import { useDocumentTitle } from '../../../utils/useDocumentTitle';

const PASSWORD_MIN_LENGTH = 10;
const ROLE_OPTIONS = [ROLES.EDITOR, ROLES.ADMIN, ROLES.SUPER_ADMIN];

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{1,30}[a-zA-Z0-9])?$/;

function validatePassword(password) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return '';
}

/** Shared create/edit form for `/admin/users/new` and `/admin/users/:id/edit`. */
export default function UserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Admin — Edit User' : 'Admin — New User');

  const navigate = useNavigate();
  const { admin: currentAdmin } = useAuth();

  const fullNameId = useId();
  const usernameId = useId();
  const emailId = useId();
  const roleId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.EDITOR);
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;

    getUserById(Number(id))
      .then((user) => {
        if (cancelled) return;
        setFullName(user.full_name);
        setUsername(user.username);
        setEmail(user.email);
        setRole(user.role);
        setIsActive(user.is_active);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isHttpError(err) && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError("Couldn't load this user. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const validate = () => {
    const errors = {};

    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!USERNAME_PATTERN.test(username) || username.length < 3 || username.length > 32) {
      errors.username = 'Username must be 3-32 characters: letters, numbers, dots, underscores, or hyphens.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';

    const wantsPassword = !isEdit || password !== '' || confirmation !== '';
    if (wantsPassword) {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
      else if (password !== confirmation) errors.confirmation = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload = {
          full_name: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          role,
          is_active: isActive,
        };
        if (password) {
          payload.password = password;
          payload.password_confirmation = confirmation;
        }
        await updateUser(Number(id), payload);
      } else {
        await createUser({
          full_name: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          role,
          is_active: isActive,
          password,
          password_confirmation: confirmation,
        });
      }
      navigate('/admin/users', { replace: true });
    } catch (err) {
      setFormError(isHttpError(err) ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="py-8 md:py-10">
        <Container className="max-w-lg">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-slate-500 mb-6">This admin user no longer exists.</p>
            <Button to="/admin/users" variant="outline" icon={ArrowLeft} iconPosition="leading">
              Back to users
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-10">
      <Container className="max-w-2xl">
        <div className="mb-8">
          <Button to="/admin/users" variant="ghost" size="sm" icon={ArrowLeft} iconPosition="leading" className="!px-3 !py-2 mb-4">
            Back to users
          </Button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2">
            {isEdit ? 'Edit user' : 'Add user'}
          </h1>
          <p className="text-slate-500 font-light">
            {isEdit ? 'Update account details, role, and status.' : 'Create a new admin account.'}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
            Loading…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 flex items-center gap-3 text-sm font-semibold text-rose-700">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-5">
            <Input
              id={fullNameId}
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldErrors.fullName}
              disabled={submitting}
              autoComplete="name"
              required
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                id={usernameId}
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={fieldErrors.username}
                disabled={submitting}
                autoComplete="username"
                required
              />
              <Input
                id={emailId}
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                disabled={submitting}
                autoComplete="email"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor={roleId} className="field-label">
                  Role
                </label>
                <select
                  id={roleId}
                  className="field-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={submitting || (role === ROLES.SUPER_ADMIN && !isSuperAdmin(currentAdmin))}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option
                      key={option}
                      value={option}
                      disabled={option === ROLES.SUPER_ADMIN && !isSuperAdmin(currentAdmin)}
                    >
                      {ROLE_LABELS[option]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="field-label">Status</span>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={submitting}
                    className="w-4 h-4 rounded accent-accent-strong"
                  />
                  <span className="text-sm font-semibold text-primary">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="field-label !mb-3">{isEdit ? 'Change password' : 'Password'}</p>
              {isEdit && (
                <p className="field-hint !mt-0 !mb-3">
                  Leave both fields blank to keep the current password.
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-5">
                <PasswordInput
                  id={passwordId}
                  label={isEdit ? 'New password' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  disabled={submitting}
                  autoComplete="new-password"
                  hint={!fieldErrors.password ? 'At least 10 characters, with a letter and a number.' : undefined}
                  required={!isEdit}
                />
                <PasswordInput
                  id={confirmId}
                  label="Confirm password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  error={fieldErrors.confirmation}
                  disabled={submitting}
                  autoComplete="new-password"
                  required={!isEdit}
                />
              </div>
            </div>

            {formError && (
              <p className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/users')} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" icon={isEdit ? Save : UserPlus} iconPosition="leading" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
              </Button>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
