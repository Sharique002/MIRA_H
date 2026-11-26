import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent ${
          error ? 'border-coral focus:ring-coral' : 'border-ink/20'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-coral font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
