import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating scroll-to-top button.
 * Appears after the user scrolls past a threshold.
 * Hidden on pages with locked scroll (e.g. study page).
 */
export default function ScrollToTop({ threshold = 400 }) {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position (e.g. after browser back navigation)
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`
        fixed bottom-6 right-6 z-50
        w-11 h-11 rounded-full
        flex items-center justify-center
        bg-bg-glass backdrop-blur-md
        border border-border-default
        text-text-secondary hover:text-accent-primary
        shadow-lg hover:shadow-glow-blue
        hover:border-accent-primary/50
        transition-all duration-300 ease-out
        cursor-pointer
        ${visible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
        }
      `}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
