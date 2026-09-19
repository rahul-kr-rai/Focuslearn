/**
 * Glassmorphism card component with optional hover effects.
 */
export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-bg-secondary border border-border-default rounded-xl
        ${paddingClasses[padding]}
        ${hover ? 'transition-all duration-200 hover:border-border-accent hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-glow-blue' : 'shadow-md'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
