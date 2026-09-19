import { Loader2 } from 'lucide-react';

/**
 * Reusable button component with variants and loading state.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-accent-primary hover:bg-blue-600 text-white focus-visible:ring-accent-primary shadow-md hover:shadow-lg hover:shadow-accent-primary/20',
    secondary:
      'bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary border border-border-default focus-visible:ring-border-default',
    ghost:
      'bg-transparent hover:bg-bg-tertiary text-text-secondary hover:text-text-primary focus-visible:ring-border-default',
    danger:
      'bg-accent-danger hover:bg-red-600 text-white focus-visible:ring-accent-danger shadow-md',
    outline:
      'bg-transparent border border-accent-primary text-accent-primary hover:bg-accent-primary/10 focus-visible:ring-accent-primary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
