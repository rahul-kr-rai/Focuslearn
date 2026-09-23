import { useEffect, useRef } from 'react';
import useYouTubePlayer from '../../hooks/useYouTubePlayer';

/**
 * Distraction-free YouTube player component.
 * Wraps the YouTube IFrame Player API with a clean container.
 *
 * @param {string} videoId - YouTube video ID to play
 * @param {Function} onVideoEnd - Callback when video finishes
 * @param {Function} onTimeUpdate - Callback with current time (seconds)
 * @param {Function} onReady - Callback when player is ready
 * @param {string} className - Additional CSS classes
 */
export default function YouTubePlayer({
  videoId,
  onVideoEnd,
  onTimeUpdate,
  onReady,
  className = '',
}) {
  const containerId = 'yt-player-container';

  const {
    isReady,
    isPlaying,
    currentTime,
    duration,
    getCurrentTime,
    seekTo,
    play,
    pause,
  } = useYouTubePlayer(videoId, {
    containerId,
    onVideoEnd,
  });

  // Notify parent of time updates
  useEffect(() => {
    if (isPlaying && onTimeUpdate) {
      onTimeUpdate(currentTime);
    }
  }, [currentTime, isPlaying, onTimeUpdate]);

  // Notify parent when ready
  useEffect(() => {
    if (isReady && onReady) {
      onReady({ getCurrentTime, duration, seekTo, play, pause });
    }
  }, [isReady, duration, seekTo, play, pause, getCurrentTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative w-full ${className}`}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div
          id={containerId}
          className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-black"
        />

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-bg-tertiary border-t-accent-primary animate-spin" />
              <p className="text-sm text-text-secondary">Loading player...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
