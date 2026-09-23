import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, progressAPI } from '../services/api';
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
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import CourseCard from '../components/course/CourseCard';
import LegalDisclaimer from '../components/layout/LegalDisclaimer';

/**
 * Format minutes/seconds into readable duration.
 */
function formatMinutes(minutes = 0) {
  if (!minutes || minutes <= 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Courses and Analytics state
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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

  // Fetch user's courses and progress analytics
  const fetchDashboardData = useCallback(async () => {
    try {
      setCoursesLoading(true);
      setCoursesError(null);
      const [coursesRes, analyticsRes] = await Promise.allSettled([
        courseAPI.getAll(),
        progressAPI.getDashboard(),
      ]);

      if (coursesRes.status === 'fulfilled') {
        const rawCourses = coursesRes.value.data.data.courses || [];
        let analyticsData = null;

        if (analyticsRes.status === 'fulfilled') {
          analyticsData = analyticsRes.value.data.data.analytics;
          setAnalytics(analyticsData);

          // Merge progress info into courses list
          if (analyticsData?.courses) {
            const progressMap = new Map(
              analyticsData.courses.map((c) => [c.courseId.toString(), c])
            );
            const enriched = rawCourses.map((c) => {
              const p = progressMap.get(c._id.toString());
              return {
                ...c,
                completionPercent: p ? p.completionPercent : 0,
                completedVideosCount: p ? p.completedVideosCount : 0,
                studyTimeMinutes: p ? p.studyTimeMinutes : 0,
              };
            });
            setCourses(enriched);
            return;
          }
        }

        setCourses(rawCourses);
      } else {
        throw coursesRes.reason;
      }
    } catch (err) {
      setCoursesError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

      // Close modal and navigate
      setTimeout(() => {
        setImportModalOpen(false);
        setPlaylistUrl('');
        setImportProgress('');
        setImporting(false);
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
      fetchDashboardData();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const streakDays = analytics?.studyStreak ?? user?.studyStreak ?? 0;
  const isStreakActive = analytics?.isStreakActiveToday ?? false;
  const totalStudyTime = analytics?.totalStudyTimeMinutes || 0;
  const overallCompletion = analytics?.overallCompletionPercent || 0;

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
      value: `${streakDays} ${streakDays === 1 ? 'day' : 'days'}`,
      icon: Flame,
      color: 'text-accent-warm',
      bg: 'bg-accent-warm/10',
      badge: isStreakActive ? 'Active Today' : null,
    },
    {
      label: 'Study Time',
      value: formatMinutes(totalStudyTime),
      icon: Clock,
      color: 'text-accent-secondary',
      bg: 'bg-accent-secondary/10',
    },
    {
      label: 'Overall Progress',
      value: `${overallCompletion}%`,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-text-secondary text-sm">Here&apos;s your learning overview.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/progress">
            <Button variant="secondary" size="sm" icon={BarChart3}>
              Analytics Hub
            </Button>
          </Link>
          <Button icon={Plus} onClick={openImport} size="sm">
            Import Playlist
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} hover padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                </div>
              </div>
              {stat.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-success/15 text-accent-success border border-accent-success/30">
                  {stat.badge}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">My Courses</h2>
          {courses.length > 0 && (
            <Link
              to="/progress"
              className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-1"
            >
              Detailed Course Analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Loading state */}
        {coursesLoading && <Loader text="Loading courses and progress..." />}

        {/* Error state */}
        {coursesError && (
          <Card className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-accent-danger mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-4">{coursesError}</p>
            <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
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

      {/* Legal Disclaimer banner */}
      <LegalDisclaimer />

      {/* ── Import Playlist Modal ── */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => !importing && setImportModalOpen(false)}
        title="Import YouTube Playlist"
      >
        <form onSubmit={handleImport} className="space-y-4">
          <p className="text-sm text-text-secondary">
            Paste a public YouTube playlist URL below. We will parse all videos, check embed
            permissions, and generate an AI-powered course structure for you.
          </p>

          <Input
            label="YouTube Playlist URL"
            icon={LinkIcon}
            type="url"
            placeholder="https://www.youtube.com/playlist?list=PL..."
            value={playlistUrl}
            onChange={(e) => {
              setPlaylistUrl(e.target.value);
              setImportError(null);
            }}
            error={importError}
            disabled={importing}
            required
          />

          {importing && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-tertiary/50 border border-border-default text-xs text-text-secondary">
              <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
              <span>{importProgress || 'Processing playlist...'}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-bg-secondary/60 border border-border-subtle text-xs text-text-tertiary">
            <span className="font-semibold text-text-secondary">Note:</span> Only videos
            with embedding enabled by the creator will be playable in the study workspace.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setImportModalOpen(false)}
              disabled={importing}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={importing}
              icon={Sparkles}
            >
              Generate Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
