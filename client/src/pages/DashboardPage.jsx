import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import {
  BookOpen,
  Plus,
  TrendingUp,
  Clock,
  Flame,
  Link as LinkIcon,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import CourseCard from '../components/course/CourseCard';
import LegalDisclaimer from '../components/layout/LegalDisclaimer';

/**
 * Format seconds into human-readable duration.
 */
function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0h 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Courses state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importProgress, setImportProgress] = useState('');

  // Delete state
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  // Fetch user's courses
  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      setCoursesError(null);
      const res = await courseAPI.getAll();
      setCourses(res.data.data.courses);
    } catch (err) {
      setCoursesError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Import playlist
  const handleImport = async (e) => {
    e.preventDefault();

    if (!playlistUrl.trim()) {
      setImportError('Please enter a YouTube playlist URL.');
      return;
    }

    try {
      setImporting(true);
      setImportError(null);
      setImportProgress('Fetching playlist info...');

      const res = await courseAPI.create({ playlistUrl: playlistUrl.trim() });
      const newCourse = res.data.data.course;

      setImportProgress('Course created!');

      // Close modal and refresh
      setTimeout(() => {
        setImportModalOpen(false);
        setPlaylistUrl('');
        setImportProgress('');
        setImporting(false);

        // Navigate to the new course page
        navigate(`/course/${newCourse._id}`);
      }, 500);
    } catch (err) {
      setImportError(
        err.response?.data?.message || 'Failed to import playlist. Please try again.'
      );
      setImporting(false);
      setImportProgress('');
    }
  };

  // Delete course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to remove this course?')) return;

    try {
      setDeletingCourseId(courseId);
      await courseAPI.delete(courseId);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingCourseId(null);
    }
  };

  // Calculate stats
  const totalStudyTime = courses.reduce(
    (sum, c) => sum + (c.totalDurationSeconds || 0),
    0
  );

  const stats = [
    {
      label: 'Enrolled Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'text-accent-primary',
      bg: 'bg-accent-primary/10',
    },
    {
      label: 'Study Streak',
      value: `${user?.studyStreak || 0} days`,
      icon: Flame,
      color: 'text-accent-warm',
      bg: 'bg-accent-warm/10',
    },
    {
      label: 'Total Content',
      value: formatDuration(totalStudyTime),
      icon: Clock,
      color: 'text-accent-secondary',
      bg: 'bg-accent-secondary/10',
    },
    {
      label: 'Completion',
      value: '0%',
      icon: TrendingUp,
      color: 'text-accent-success',
      bg: 'bg-accent-success/10',
    },
  ];

  // Open import modal
  const openImport = () => {
    setImportModalOpen(true);
    setImportError(null);
    setPlaylistUrl('');
    setImportProgress('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-text-secondary">Here&apos;s your learning overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} hover padding="md">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Courses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">My Courses</h2>
          <Button icon={Plus} onClick={openImport} size="sm">
            Import Playlist
          </Button>
        </div>

        {/* Loading state */}
        {coursesLoading && <Loader text="Loading courses..." />}

        {/* Error state */}
        {coursesError && (
          <Card className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-accent-danger mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-4">{coursesError}</p>
            <Button variant="secondary" size="sm" onClick={fetchCourses}>
              Retry
            </Button>
          </Card>
        )}

        {/* Empty state */}
        {!coursesLoading && !coursesError && courses.length === 0 && (
          <Card className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-tertiary mb-4">
              <BookOpen className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No courses yet</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
              Import your first YouTube playlist to get started. Paste a playlist URL and
              we&apos;ll turn it into a structured course.
            </p>
            <Button icon={Plus} onClick={openImport}>
              Import Your First Playlist
            </Button>
          </Card>
        )}

        {/* Course grid */}
        {!coursesLoading && !coursesError && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onDelete={handleDeleteCourse}
                isDeleting={deletingCourseId === course._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Legal Disclaimer */}
      <LegalDisclaimer compact />

      {/* ── Import Playlist Modal ── */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => !importing && setImportModalOpen(false)}
        title="Import YouTube Playlist"
        size="md"
      >
        <form onSubmit={handleImport}>
          <div className="mb-4">
            <p className="text-sm text-text-secondary mb-4">
              Paste a YouTube playlist URL to create a new course. We&apos;ll fetch all
              videos and organize them into a structured learning path.
            </p>

            <Input
              label="Playlist URL"
              icon={LinkIcon}
              placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
              value={playlistUrl}
              onChange={(e) => {
                setPlaylistUrl(e.target.value);
                setImportError(null);
              }}
              error={importError}
              disabled={importing}
              autoFocus
            />
          </div>

          {/* Import progress */}
          {importing && importProgress && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-accent-primary/10">
              <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
              <span className="text-sm text-accent-primary font-medium">
                {importProgress}
              </span>
            </div>
          )}

          {/* Tips */}
          <div className="mb-6 px-3 py-2.5 rounded-lg bg-bg-tertiary/50 border border-border-subtle">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-accent-warm shrink-0 mt-0.5" />
              <div className="text-xs text-text-tertiary space-y-1">
                <p>Supported formats:</p>
                <ul className="list-disc list-inside space-y-0.5 text-text-tertiary/80">
                  <li>youtube.com/playlist?list=PLxxxxxx</li>
                  <li>youtube.com/watch?v=xxx&list=PLxxxxxx</li>
                  <li>Raw playlist ID (e.g., PLxxxxxx)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setImportModalOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button type="submit" loading={importing} icon={Plus}>
              {importing ? 'Importing...' : 'Import Playlist'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
