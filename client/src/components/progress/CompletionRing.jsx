/**
 * Circular progress ring component with gradient fill.
 */
export default function CompletionRing({
  percentage = 0,
  size = 120,
  strokeWidth = 10,
  label = 'Completed',
  sublabel = '',
  color = 'from-accent-primary to-accent-secondary',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-bg-tertiary"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Path */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progress-gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-text-primary tracking-tight font-mono">
            {clamped}%
          </span>
        </div>
      </div>

      {label && <p className="mt-2 text-xs font-semibold text-text-secondary">{label}</p>}
      {sublabel && <p className="text-[11px] text-text-tertiary">{sublabel}</p>}
    </div>
  );
}
