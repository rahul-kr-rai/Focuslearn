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
  FileText,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { courseAPI, noteAPI } from '../services/api';
import YouTubePlayer from '../components/player/YouTubePlayer';
import ModuleList from '../components/course/ModuleList';
import CreatorAttribution from '../components/course/CreatorAttribution';
import NoteEditor from '../components/notes/NoteEditor';
import NoteList from '../components/notes/NoteList';
import QuizPanel from '../components/quiz/QuizPanel';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { formatTime } from '../utils/formatters';

/**
 * Study page — distraction-free split-panel layout.
 * Left: YouTube player + tabbed workspace (Notes, AI Quiz, Overview)
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

  // Player controls & state
  const [playerControls, setPlayerControls] = useState(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  // Study workspace tabs: 'notes' | 'quiz' | 'overview'
  const [activeTab, setActiveTab] = useState('notes');

  // Notes state
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Quiz state
  const [quizScoreBadge, setQuizScoreBadge] = useState(null);

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

  // Fetch notes whenever active video changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!activeVideo) return;
      try {
        setLoadingNotes(true);
        setEditingNote(null);
        const idToQuery = activeVideo.videoId || activeVideo._id;
        const res = await noteAPI.getByVideo(idToQuery);
        setNotes(res.data.data.notes || []);
      } catch (err) {
        console.error('Failed to fetch notes for video:', err);
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [activeVideo]);

  // Handle video selection from sidebar
  const handleVideoSelect = useCallback((video) => {
    setActiveVideo(video);
    setEditingNote(null);
    setQuizScoreBadge(null);
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
        setEditingNote(null);
        setQuizScoreBadge(null);
      }
    },
    [course, activeVideo]
  );

  // Player seek action (e.g. from note timestamp click)
  const handleSeekTo = useCallback(
    (timestampInSeconds) => {
      if (playerControls?.seekTo) {
        playerControls.seekTo(timestampInSeconds);
        playerControls.play?.();
      }
    },
    [playerControls]
  );

  // Note saved callback
  const handleNoteSaved = useCallback((savedNote, action) => {
    if (action === 'update') {
      setNotes((prev) =>
        prev.map((n) => (n._id === savedNote._id ? savedNote : n))
      );
    } else {
      setNotes((prev) => {
        const next = [...prev, savedNote];
        return next.sort((a, b) => a.timestamp - b.timestamp);
      });
    }
    setEditingNote(null);
  }, []);

  // Note delete action
  const handleDeleteNote = useCallback(async (noteId) => {
    try {
      await noteAPI.delete(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }, []);

  // Quiz completion callback
  const handleQuizCompleted = useCallback((result) => {
    setQuizScoreBadge({
      score: result.score,
      total: result.total,
      percentage: result.percentage,
    });
  }, []);

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
            onTimeUpdate={setCurrentVideoTime}
            onReady={setPlayerControls}
          />

          {/* Creator Attribution */}
          <CreatorAttribution
            channelTitle={activeVideo.channelTitle || course.channelTitle}
            channelId={activeVideo.channelId || course.channelId}
            videoId={activeVideo.videoId}
            videoTitle={activeVideo.title}
            className="mt-4"
          />

          {/* Video Navigation Bar */}
          <div className="flex items-center justify-between mt-4 pb-4 border-b border-border-default/60">
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

            {/* Current video info & live timestamp */}
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary truncate max-w-xs sm:max-w-md">
                {activeVideo.title}
              </p>
              <div className="flex items-center justify-end gap-2 text-xs text-text-tertiary">
                <span>
                  Lesson {(currentIndex || 0) + 1} of {course.videos?.length || 0}
                </span>
                <span>•</span>
                <span className="font-mono text-accent-primary">
                  {formatTime(currentVideoTime)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Interactive Workspace (Tabs for Notes, AI Quiz, Overview) ── */}
          <div className="mt-6 mb-16">
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 border-b border-border-default/80 pb-px mb-6">
              {/* Notes Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`relative px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'notes'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Notes</span>
                <span className="px-1.5 py-0.2 rounded-full text-xs font-mono bg-bg-tertiary text-accent-secondary">
                  {notes.length}
                </span>
              </button>

              {/* AI Quiz Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`relative px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'quiz'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Quiz</span>
                {quizScoreBadge ? (
                  <span className="px-1.5 py-0.2 rounded-full text-xs font-mono bg-accent-success/20 text-accent-success">
                    {quizScoreBadge.percentage}%
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-primary/15 text-accent-primary">
                    AI
                  </span>
                )}
              </button>

              {/* Overview Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`relative px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'overview'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Overview</span>
              </button>
            </div>

            {/* Tab 1: Notes Module */}
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-fade-in">
                {/* Note Editor */}
                <NoteEditor
                  videoId={activeVideo.videoId || activeVideo._id}
                  courseId={course._id}
                  currentVideoTime={currentVideoTime}
                  onNoteSaved={handleNoteSaved}
                  editingNote={editingNote}
                  onCancelEdit={() => setEditingNote(null)}
                />

                {/* Note List */}
                <NoteList
                  notes={notes}
                  loading={loadingNotes}
                  onSeekTo={handleSeekTo}
                  onEdit={(note) => {
                    setEditingNote(note);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  onDelete={handleDeleteNote}
                  videoTitle={activeVideo.title}
                  courseTitle={course.title}
                />
              </div>
            )}

            {/* Tab 2: AI Quiz Module */}
            {activeTab === 'quiz' && (
              <div className="animate-fade-in">
                <QuizPanel
                  videoId={activeVideo.videoId || activeVideo._id}
                  videoTitle={activeVideo.title}
                  courseId={course._id}
                  onQuizCompleted={handleQuizCompleted}
                />
              </div>
            )}

            {/* Tab 3: Overview & Description */}
            {activeTab === 'overview' && (
              <div className="rounded-2xl border border-border-default/80 bg-bg-secondary/40 p-6 space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">
                    {activeVideo.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                    <span>
                      Channel:{' '}
                      <strong className="text-text-primary">
                        {activeVideo.channelTitle || course.channelTitle}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {activeVideo.durationSeconds
                        ? formatTime(activeVideo.durationSeconds)
                        : activeVideo.duration || 'Duration N/A'}
                    </span>
                    <span>•</span>
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent-primary hover:underline"
                    >
                      Watch on YouTube
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {activeVideo.description ? (
                  <div className="pt-3 border-t border-border-default/60 text-xs text-text-secondary whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
                    {activeVideo.description}
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary italic">
                    No description provided for this lesson.
                  </p>
                )}
              </div>
            )}
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
