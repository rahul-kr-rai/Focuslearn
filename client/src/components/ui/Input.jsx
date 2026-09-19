import { forwardRef } from 'react';

/**
 * Reusable input component with label and error support.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    icon: Icon = null,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-text-tertiary" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-bg-secondary border border-border-default rounded-lg
            py-2.5 text-sm text-text-primary placeholder-text-tertiary
            transition-all duration-200
            focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50
            hover:border-border-default/80
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-10 pr-4' : 'px-4'}
            ${error ? 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-accent-danger">{error}</p>
      )}
    </div>
  );
});

export default Input;
