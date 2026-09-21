import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  SkipForward,
} from 'lucide-react';
import { courseAPI } from '../services/api';
import YouTubePlayer from '../components/player/YouTubePlayer';
import ModuleList from '../components/course/ModuleList';
import CreatorAttribution from '../components/course/CreatorAttribution';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';

/**
 * Study page — distraction-free split-panel layout.
 * Left: YouTube player + creator attribution
 * Right: Module/video list sidebar
 */
export default function StudyPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [completedVideoIds, setCompletedVideoIds] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await courseAPI.getById(courseId);
        const courseData = res.data.data.course;
        setCourse(courseData);

        // Set first embeddable video as active
        if (courseData.videos?.length > 0) {
          const firstEmbeddable = courseData.videos.find((v) => v.isEmbeddable !== false);
          setActiveVideo(firstEmbeddable || courseData.videos[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Handle video selection from sidebar
  const handleVideoSelect = useCallback((video) => {
    setActiveVideo(video);
  }, []);

  // Handle video completion
  const handleVideoEnd = useCallback(() => {
    if (!activeVideo) return;

    setCompletedVideoIds((prev) => {
      const next = new Set(prev);
      next.add(activeVideo.videoId);
      return next;
    });

    // Auto-advance to next video
    if (course?.videos) {
      const currentIndex = course.videos.findIndex(
        (v) => v.videoId === activeVideo.videoId
      );
      const nextVideo = course.videos.find(
        (v, i) => i > currentIndex && v.isEmbeddable !== false
      );
      if (nextVideo) {
        setActiveVideo(nextVideo);
      }
    }
  }, [activeVideo, course]);

  // Navigate to next/previous video
  const navigateVideo = useCallback(
    (direction) => {
      if (!course?.videos || !activeVideo) return;
      const currentIndex = course.videos.findIndex(
        (v) => v.videoId === activeVideo.videoId
      );
      let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

      // Skip non-embeddable videos
      while (
        targetIndex >= 0 &&
        targetIndex < course.videos.length &&
        course.videos[targetIndex].isEmbeddable === false
      ) {
        targetIndex += direction === 'next' ? 1 : -1;
      }

      if (targetIndex >= 0 && targetIndex < course.videos.length) {
        setActiveVideo(course.videos[targetIndex]);
      }
    },
    [course, activeVideo]
  );

  // Loading state
  if (loading) return <Loader fullPage text="Loading study session..." />;

  // Error state
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

  if (!course || !activeVideo) return null;

  // Find current position
  const currentIndex = course.videos?.findIndex(
    (v) => v.videoId === activeVideo.videoId
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (course.videos?.length || 0) - 1;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden animate-fade-in">
      {/* ── Main Content Area ── */}
      <div
        className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'mr-0' : ''
        }`}
      >
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to={`/course/${courseId}`}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{course.title}</span>
              <span className="sm:hidden">Back</span>
            </Link>

            {/* Sidebar toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Video Player */}
          <YouTubePlayer
            videoId={activeVideo.videoId}
            onVideoEnd={handleVideoEnd}
          />

          {/* Creator Attribution */}
          <CreatorAttribution
            channelTitle={activeVideo.channelTitle || course.channelTitle}
            channelId={activeVideo.channelId || course.channelId}
            videoId={activeVideo.videoId}
            videoTitle={activeVideo.title}
            className="mt-4"
          />

          {/* Video navigation */}
          <div className="flex items-center justify-between mt-4 pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                onClick={() => navigateVideo('prev')}
                disabled={!hasPrev}
              >
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={SkipForward}
                onClick={() => navigateVideo('next')}
                disabled={!hasNext}
              >
                <span className="hidden sm:inline">Next</span>
              </Button>
            </div>

            {/* Current video info */}
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary truncate max-w-xs">
                {activeVideo.title}
              </p>
              <p className="text-xs text-text-tertiary">
                Lesson {(currentIndex || 0) + 1} of {course.videos?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div
        className={`
          shrink-0 transition-all duration-300 border-l border-border-default
          ${sidebarOpen ? 'w-80 xl:w-96' : 'w-0 overflow-hidden'}
          fixed lg:relative right-0 top-16 bottom-0 z-30 bg-bg-primary lg:bg-transparent
        `}
      >
        {/* Sidebar toggle (desktop) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -left-3 top-6 z-10 w-6 h-6 rounded-full bg-bg-secondary border border-border-default items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors shadow-md"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="h-full p-3">
          <ModuleList
            videos={course.videos || []}
            activeVideoId={activeVideo.videoId}
            completedVideoIds={completedVideoIds}
            onVideoSelect={handleVideoSelect}
            courseTitle={course.title}
          />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
