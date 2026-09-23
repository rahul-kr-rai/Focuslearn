import { Link } from 'react-router-dom';
import { Play, CheckCircle2, BookOpen, Clock, Award, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * Format minutes into readable hour string.
 */
function formatMinutes(minutes = 0) {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

/**
 * CourseProgressCard — Detailed progress tracking card for individual courses.
 */
export default function CourseProgressCard({ courseProgress }) {
  const {
    courseId,
    title,
    thumbnailUrl,
    channelTitle,
    totalVideos = 0,
    completedVideosCount = 0,
    completionPercent = 0,
    studyTimeMinutes = 0,
    currentVideo,
    quizzesTaken = 0,
    quizAverageScore = 0,
  } = courseProgress;

  const isCompleted = completionPercent === 100;

  return (
    <Card hover padding="none" className="overflow-hidden flex flex-col justify-between">
      <div>
        {/* Top Thumbnail with overlay */}
        <div className="relative aspect-video w-full overflow-hidden bg-bg-tertiary">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-text-tertiary" />
            </div>
          )}

          {/* Completion Badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-accent-success/90 backdrop-blur-sm text-slate-950 text-xs font-bold flex items-center gap-1 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </div>
          )}

          {/* Progress Pill */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-xs font-mono font-semibold text-text-primary">
            {completedVideosCount}/{totalVideos} Lessons ({completionPercent}%)
          </div>
        </div>

        {/* Course Details */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="text-sm font-bold text-text-primary line-clamp-1 hover:text-accent-primary transition-colors">
              <Link to={`/course/${courseId}`}>{title}</Link>
            </h4>
            <p className="text-xs text-text-tertiary mt-0.5 truncate">{channelTitle}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
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

          {/* Stats Meta Chips */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5 text-accent-secondary" />
              <span>Time: {formatMinutes(studyTimeMinutes)}</span>
            </div>

            {quizzesTaken > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Sparkles className="w-3.5 h-3.5 text-accent-warm" />
                <span>Quiz Avg: {quizAverageScore}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <Award className="w-3.5 h-3.5" />
                <span>No quiz yet</span>
              </div>
            )}
          </div>

          {/* Current / Last Watched Lesson */}
          {currentVideo && (
            <div className="p-2 rounded-lg bg-bg-tertiary/40 border border-border-subtle text-xs text-text-secondary">
              <span className="text-[10px] uppercase font-semibold text-text-tertiary block">
                Up Next / Resume:
              </span>
              <p className="font-medium text-text-primary truncate mt-0.5">
                {currentVideo.title}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="p-4 pt-0">
        <Link to={`/study/${courseId}`} className="block w-full">
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            icon={Play}
            className="w-full"
          >
            {isCompleted ? 'Review Course' : 'Resume Learning'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
