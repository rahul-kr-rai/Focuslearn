import { Link } from 'react-router-dom';
import {
  Play,
  Clock,
  Video,
  ExternalLink,
  Trash2,
  CheckCircle2,
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
 * Course card for dashboard — shows thumbnail, title, channel, progress bar, stats.
 *
 * @param {Object} course - Course document from API
 * @param {Function} onDelete - Callback to delete course
 * @param {boolean} isDeleting - Whether delete is in progress
 */
export default function CourseCard({ course, onDelete, isDeleting = false }) {
  const completionPercent = course.completionPercent || 0;
  const isCompleted = completionPercent === 100;

  return (
    <Card hover padding="none" className="overflow-hidden group flex flex-col justify-between">
      <div>
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

          {/* Completion Badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent-success/90 backdrop-blur-sm text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </div>
          )}

          {/* Play overlay */}
          <Link
            to={`/study/${course._id}`}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-accent-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </Link>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-xs text-white font-medium">
            {formatDuration(course.totalDurationSeconds)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
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
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-secondary transition-colors"
          >
            <div className="w-4 h-4 rounded-full bg-accent-secondary/20 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-accent-secondary">
                {course.channelTitle?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span className="truncate">{course.channelTitle}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Progress Bar (if available) */}
          <div className="pt-1">
            <div className="flex justify-between items-center text-[11px] text-text-tertiary mb-1">
              <span>Progress</span>
              <span className="font-mono font-bold text-text-secondary">{completionPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-accent-success'
                    : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
                }`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row & Actions */}
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between pt-3 border-t border-border-default">
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />
              {course.totalVideos} lessons
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to={`/study/${course._id}`}
              className="text-xs font-semibold text-accent-primary hover:text-blue-400 px-2 py-1 rounded transition-colors"
            >
              {completionPercent > 0 ? 'Resume' : 'Start'}
            </Link>

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
      </div>
    </Card>
  );
}
