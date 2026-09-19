import { Loader2 } from 'lucide-react';

/**
 * Full-page or inline loading spinner.
 */
export default function Loader({ fullPage = false, text = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-bg-tertiary border-t-accent-primary animate-spin" />
        </div>
        <p className="mt-4 text-sm text-text-secondary animate-pulse">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      <p className="mt-3 text-sm text-text-secondary">{text}</p>
    </div>
  );
}
