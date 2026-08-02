import { useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Label is mandatory and always paired to the field via htmlFor/id (falls
 * back to a generated id via useId) — fixes the unassociated-label issue
 * flagged in docs/01-WEBSITE-AUDIT-AND-ROADMAP.md §6.2.
 */
const Input = ({ id, label, hint, error, className, ...props }) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <input
        id={inputId}
        className={cn('field-input', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        {...props}
      />
      {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
    </div>
  );
};

export default Input;
