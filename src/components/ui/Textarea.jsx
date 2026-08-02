import { useId } from 'react';
import { cn } from '../../utils/cn';

const Textarea = ({ id, label, hint, error, rows = 5, className, ...props }) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        className={cn('field-input resize-none', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        {...props}
      />
      {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
    </div>
  );
};

export default Textarea;
