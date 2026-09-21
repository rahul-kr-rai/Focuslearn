import { Link } from 'react-router-dom';
import {
  Play,
  Clock,
  Video,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import Card from '../ui/Card';

/**
 * Format seconds into human-readable duration.
 */
function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Course card for dashboard — shows thumbnail, title, channel, stats.
 *
 * @param {Object} course - Course document from API
 * @param {Function} onDelete - Callback to delete course
 * @param {boolean} isDeleting - Whether delete is in progress
 */
export default function CourseCard({ course, onDelete, isDeleting = false }) {
  return (
    <Card hover padding="none" className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
            <Video className="w-12 h-12 text-text-tertiary" />
          </div>
        )}

        {/* Play overlay */}
        <Link
          to={`/course/${course._id}`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-full bg-accent-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
        </Link>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-xs text-white font-medium">
          {formatDuration(course.totalDurationSeconds)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link
          to={`/course/${course._id}`}
          className="block group/title"
        >
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover/title:text-accent-primary transition-colors duration-200">
            {course.title}
          </h3>
        </Link>

        {/* Channel */}
        <a
          href={`https://www.youtube.com/channel/${course.channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mt-2 text-xs text-text-secondary hover:text-accent-secondary transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-accent-secondary/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-accent-secondary">
              {course.channelTitle?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <span className="truncate">{course.channelTitle}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-default">
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />
              {course.totalVideos} videos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(course.totalDurationSeconds)}
            </span>
          </div>

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(course._id);
              }}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
              title="Remove course"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
