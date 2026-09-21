import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Clock,
  Video,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Back link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Course header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                <Video className="w-16 h-16 text-text-tertiary" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {course.title}
          </h1>

          {/* Channel attribution */}
          <a
            href={`https://www.youtube.com/channel/${course.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-secondary transition-colors mb-4"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-danger to-accent-warm flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {course.channelTitle?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span>{course.channelTitle}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {course.description && (
            <p className="text-sm text-text-secondary mb-4 line-clamp-3">
              {course.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-6">
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              icon={Play}
              onClick={() => navigate(`/study/${course._id}`)}
              size="lg"
            >
              Start Learning
            </Button>
            <a
              href={course.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" icon={ExternalLink} size="lg">
                View on YouTube
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Video list */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
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
              className={`${!video.isEmbeddable ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4 p-3">
                {/* Position */}
                <div className="shrink-0 w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
                  <span className="text-xs font-medium text-text-tertiary">
                    {index + 1}
                  </span>
                </div>

                {/* Thumbnail */}
                <div className="shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-bg-tertiary">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-text-tertiary" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-tertiary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(video.durationSeconds)}
                    </span>
                    {!video.isEmbeddable && (
                      <span className="text-xs text-accent-warm flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Not embeddable
                      </span>
                    )}
                  </div>
                </div>

                {/* Play icon */}
                {video.isEmbeddable && (
                  <Play className="w-4 h-4 text-text-tertiary shrink-0" />
                )}
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
