import { useEffect, useRef } from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  Video as VideoIcon,
} from 'lucide-react';

/**
 * Format seconds to MM:SS or HH:MM:SS.
 */
function formatTimestamp(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Module/video list sidebar for the study page.
 * Shows all videos in a course with completion checkmarks.
 *
 * @param {Array} videos - Array of Video documents
 * @param {string} activeVideoId - Currently playing video's YouTube ID
 * @param {Set} completedVideoIds - Set of completed video YouTube IDs
 * @param {Function} onVideoSelect - Callback when user clicks a video
 * @param {string} courseTitle - Course title for the header
 */
export default function ModuleList({
  videos = [],
  activeVideoId,
  completedVideoIds = new Set(),
  onVideoSelect,
  courseTitle = 'Course Modules',
}) {
  const completedCount = completedVideoIds.size;
  const totalCount = videos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Refs for auto-scrolling to the active video
  const listRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const container = listRef.current;
    const item = itemRefs.current[activeVideoId];
    if (!activeVideoId || !container || !item) return;
    // Small delay to let the DOM settle after render
    const timer = setTimeout(() => {
      // Scroll only within the sidebar container, not the page
      const itemTop = item.offsetTop - container.offsetTop;
      const targetScroll = itemTop - 80;
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeVideoId]);

  return (
    <div className="flex flex-col h-full bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-default shrink-0">
        <h3 className="text-sm font-semibold text-text-primary truncate mb-2">
          {courseTitle}
        </h3>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Video list */}
      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {videos.map((video, index) => {
          const isActive = video.videoId === activeVideoId;
          const isCompleted =
            completedVideoIds.has(video.videoId) ||
            completedVideoIds.has(video._id) ||
            completedVideoIds.has(video._id?.toString?.());
          const isEmbeddable = video.isEmbeddable !== false;

          return (
            <button
              key={video._id || video.videoId}
              ref={(el) => { itemRefs.current[video.videoId] = el; }}
              onClick={() => isEmbeddable && onVideoSelect?.(video)}
              disabled={!isEmbeddable}
              className={`
                w-full flex items-start gap-3 p-3 text-left transition-all duration-200 border-b border-border-subtle
                ${isActive
                  ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary'
                  : 'hover:bg-bg-tertiary/50 border-l-2 border-l-transparent'
                }
                ${!isEmbeddable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Position / Status indicator */}
              <div className="shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-accent-success" />
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </div>
                ) : (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-bg-tertiary text-xs text-text-tertiary font-medium">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Video info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium line-clamp-2 ${
                    isActive ? 'text-accent-primary' : 'text-text-primary'
                  }`}
                >
                  {video.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-text-tertiary flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(video.durationSeconds)}
                  </span>
                  {!isEmbeddable && (
                    <span className="text-[10px] text-accent-warm font-medium">
                      Not embeddable
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
