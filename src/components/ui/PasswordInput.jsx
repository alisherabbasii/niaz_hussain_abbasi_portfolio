import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Same contract as <Input>, plus a show/hide toggle inside the field.
 * Toggling only flips the input's `type` — the value itself is never
 * touched, so autofill and existing onChange/validation wiring keep working.
 */
const PasswordInput = ({ id, label, hint, error, className, disabled, ...props }) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn('field-input pr-11', className)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-r-xl"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
    </div>
  );
};

export default PasswordInput;
