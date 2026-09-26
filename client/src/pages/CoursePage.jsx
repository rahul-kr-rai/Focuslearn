import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Clock,
  Video,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { courseAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import LegalDisclaimer from '../components/layout/LegalDisclaimer';

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
 * Course detail page — shows course info, video list, and "Start Learning" button.
 * Fully responsive for mobile, tablet, and desktop.
 */
export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await courseAPI.getById(id);
        setCourse(res.data.data.course);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) return <Loader fullPage text="Loading course..." />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-accent-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-sm text-text-secondary mb-6">{error}</p>
        <Button onClick={() => navigate('/dashboard')} icon={ArrowLeft}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!course) return null;

  const embeddableVideos = course.videos?.filter((v) => v.isEmbeddable) || [];
  const nonEmbeddableVideos = course.videos?.filter((v) => !v.isEmbeddable) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Back link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 sm:mb-6 min-h-[44px] sm:min-h-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Course header — stacks vertically on mobile, side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Thumbnail */}
        <div className="lg:col-span-1">
          <div className="aspect-video rounded-xl overflow-hidden bg-bg-tertiary">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-12 h-12 sm:w-16 sm:h-16 text-text-tertiary" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
            {course.title}
          </h1>

          {/* Channel attribution */}
          <a
            href={`https://www.youtube.com/channel/${course.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-secondary transition-colors mb-3 sm:mb-4 min-h-[44px] sm:min-h-0"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-danger to-accent-warm flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {course.channelTitle?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span className="truncate">{course.channelTitle}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          {course.description && (
            <p className="text-sm text-text-secondary mb-3 sm:mb-4 line-clamp-3">
              {course.description}
            </p>
          )}

          {/* Stats — wrap naturally on small screens */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <Video className="w-4 h-4" />
              <span>{course.totalVideos} videos</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(course.totalDurationSeconds)}</span>
            </div>
            {nonEmbeddableVideos.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-accent-warm">
                <AlertTriangle className="w-4 h-4" />
                <span>{nonEmbeddableVideos.length} not embeddable</span>
              </div>
            )}
          </div>

          {/* Actions — full-width stacked on mobile, inline on sm+ */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              icon={Play}
              onClick={() => navigate(`/study/${course._id}`)}
              size="lg"
              fullWidth={false}
              className="w-full sm:w-auto justify-center"
            >
              Start Learning
            </Button>
            <Button
              variant="secondary"
              icon={Sparkles}
              onClick={() => navigate(`/course/${course._id}/quizzes`)}
              size="lg"
              className="w-full sm:w-auto justify-center"
            >
              All Quizzes
            </Button>
            <a
              href={course.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="ghost" icon={ExternalLink} size="lg" className="w-full sm:w-auto justify-center">
                View on YouTube
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Course Navigation Tabs — horizontally scrollable on mobile */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-border-default mb-4 sm:mb-6 overflow-x-auto scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          className="px-3 sm:px-4 py-3 text-sm font-bold border-b-2 border-accent-primary text-accent-primary flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Video className="w-4 h-4" />
          <span>Course Content ({course.videos?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/course/${course._id}/quizzes`)}
          className="px-3 sm:px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-t-lg transition-all flex items-center gap-2 group cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform" />
          <span>All Quizzes</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hidden sm:inline">
            Assessment Portal
          </span>
        </button>
      </div>

      {/* Video list */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">
          Course Content
          <span className="text-sm font-normal text-text-tertiary ml-2">
            {course.videos?.length || 0} lessons
          </span>
        </h2>

        <div className="space-y-2">
          {course.videos?.map((video, index) => (
            <Card
              key={video._id}
              hover
              padding="none"
              className={`${!video.isEmbeddable ? 'opacity-60' : 'cursor-pointer'}`}
              onClick={() => {
                if (video.isEmbeddable) {
                  navigate(`/study/${course._id}?video=${video._id}`);
                }
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3">
                {/* Position */}
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </div>

                {/* Thumbnail — hidden on very small screens to save space */}
                <div className="shrink-0 w-20 h-12 sm:w-24 sm:h-14 rounded-lg overflow-hidden bg-bg-tertiary hidden xs:flex">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-5 h-5 sm:w-6 sm:h-6 text-text-tertiary" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-text-primary truncate">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1">
                    <span className="text-xs text-text-tertiary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(video.durationSeconds)}
                    </span>
                    {!video.isEmbeddable && (
                      <span className="text-xs text-accent-warm flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="hidden sm:inline">Not embeddable</span>
                        <span className="sm:hidden">N/A</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <LegalDisclaimer compact />
    </div>
  );
}
