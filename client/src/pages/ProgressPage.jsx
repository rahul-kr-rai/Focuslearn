import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  Flame,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { progressAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import CompletionRing from '../components/progress/CompletionRing';
import StreakTracker from '../components/progress/StreakTracker';
import GoalSetter from '../components/progress/GoalSetter';
import CourseProgressCard from '../components/progress/CourseProgressCard';

/**
 * Format minutes into hours + minutes string.
 */
function formatMinutes(minutes = 0) {
  if (!minutes || minutes <= 0) return '0h 0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function ProgressPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'in_progress' | 'completed'

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await progressAPI.getDashboard();
      setAnalytics(res.data.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle updating goal
  const handleSaveGoal = async (newGoalHours) => {
    // If user has courses, update the first one or save to state
    if (analytics?.courses?.length > 0) {
      const firstCourseId = analytics.courses[0].courseId;
      await progressAPI.update(firstCourseId, { goalHoursPerWeek: newGoalHours });
    }
    fetchAnalytics();
  };

  if (loading) {
    return <Loader fullPage text="Loading your learning analytics..." />;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-accent-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Analytics Error</h2>
        <p className="text-sm text-text-secondary mb-6">{error}</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    );
  }

  const {
    totalCourses = 0,
    completedCourses = 0,
    inProgressCourses = 0,
    notStartedCourses = 0,
    totalVideos = 0,
    completedVideos = 0,
    overallCompletionPercent = 0,
    totalStudyTimeMinutes = 0,
    studyStreak = 0,
    isStreakActiveToday = false,
    lastStudyDate = null,
    totalQuizzesTaken = 0,
    overallQuizAverage = 0,
    courses = [],
  } = analytics || {};

  // Filter courses based on active tab
  const filteredCourses = courses.filter((c) => {
    if (filterTab === 'in_progress') return c.completionPercent > 0 && c.completionPercent < 100;
    if (filterTab === 'completed') return c.completionPercent === 100;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Learning <span className="gradient-text">Analytics & Progress</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time tracking of your study momentum, quiz scores, and course completions.
          </p>
        </div>

        <Link to="/dashboard">
          <Button variant="secondary" size="sm" icon={BookOpen}>
            Go to Courses
          </Button>
        </Link>
      </div>

      {/* ── Top Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <Card hover padding="md" className="border-l-4 border-l-accent-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Total Study Time
              </p>
              <p className="text-2xl font-black text-text-primary mt-1 font-mono">
                {formatMinutes(totalStudyTimeMinutes)}
              </p>
              <p className="text-[11px] text-accent-secondary mt-0.5">
                Across {totalCourses} enrolled {totalCourses === 1 ? 'course' : 'courses'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-accent-secondary/15 text-accent-secondary">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Study Streak */}
        <Card hover padding="md" className="border-l-4 border-l-accent-warm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Study Streak
              </p>
              <p className="text-2xl font-black text-text-primary mt-1 font-mono">
                {studyStreak} {studyStreak === 1 ? 'Day' : 'Days'}
              </p>
              <p className="text-[11px] text-accent-warm mt-0.5">
                {isStreakActiveToday ? '🔥 Studied today' : '⚡ Study today to keep it'}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-accent-warm/15 text-accent-warm">
              <Flame className="w-6 h-6 fill-accent-warm" />
            </div>
          </div>
        </Card>

        {/* Overall Completion */}
        <Card hover padding="md" className="border-l-4 border-l-accent-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Completion Rate
              </p>
              <p className="text-2xl font-black text-text-primary mt-1 font-mono">
                {overallCompletionPercent}%
              </p>
              <p className="text-[11px] text-accent-success mt-0.5">
                {completedVideos} of {totalVideos} lessons done
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-accent-success/15 text-accent-success">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* AI Quiz Average */}
        <Card hover padding="md" className="border-l-4 border-l-accent-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Quiz Mastery
              </p>
              <p className="text-2xl font-black text-text-primary mt-1 font-mono">
                {totalQuizzesTaken > 0 ? `${overallQuizAverage}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-accent-primary mt-0.5">
                {totalQuizzesTaken} {totalQuizzesTaken === 1 ? 'quiz' : 'quizzes'} evaluated
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-accent-primary/15 text-accent-primary">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Mid Section: Streak Tracker & Weekly Goals & Radial Completion ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Streak Calendar + Weekly Goal */}
        <div className="lg:col-span-2 space-y-6">
          <StreakTracker
            streak={studyStreak}
            isStreakActiveToday={isStreakActiveToday}
            lastStudyDate={lastStudyDate}
          />

          <GoalSetter
            currentStudyMinutes={totalStudyTimeMinutes}
            goalHours={5}
            onSaveGoal={handleSaveGoal}
          />
        </div>

        {/* Right Column (1 Col): Overall Completion Radial & Breakdown */}
        <div className="space-y-6">
          <Card padding="lg" className="flex flex-col items-center justify-center text-center">
            <h3 className="text-base font-bold text-text-primary mb-4 self-start">
              Platform Completion
            </h3>

            <CompletionRing
              percentage={overallCompletionPercent}
              size={140}
              strokeWidth={12}
              label="Overall Progress"
              sublabel={`${completedVideos}/${totalVideos} total lessons`}
            />

            <div className="w-full mt-6 pt-4 border-t border-border-default/60 space-y-2 text-xs">
              <div className="flex justify-between items-center text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-success" />
                  Completed Courses
                </span>
                <strong className="text-text-primary font-mono">{completedCourses}</strong>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
                  In Progress
                </span>
                <strong className="text-text-primary font-mono">{inProgressCourses}</strong>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-bg-tertiary" />
                  Not Started
                </span>
                <strong className="text-text-primary font-mono">{notStartedCourses}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Course Progress Breakdown Section ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-default">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Course Progress Breakdown</h2>
            <p className="text-xs text-text-secondary">
              Detailed tracking and direct lesson resume for each course.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-xl border border-border-default">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterTab === 'all'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              All ({courses.length})
            </button>
            <button
              onClick={() => setFilterTab('in_progress')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterTab === 'in_progress'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              In Progress ({inProgressCourses})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterTab === 'completed'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Completed ({completedCourses})
            </button>
          </div>
        </div>

        {/* Empty state */}
        {filteredCourses.length === 0 ? (
          <Card className="text-center py-12">
            <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text-primary mb-1">
              No courses matching this filter
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
              {filterTab === 'completed'
                ? 'Complete all lessons in a course to see it listed here.'
                : 'Import new playlists from YouTube to track your learning journey.'}
            </p>
            <Link to="/dashboard">
              <Button size="sm" icon={Plus}>
                Explore / Import Courses
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c) => (
              <CourseProgressCard key={c.courseId} courseProgress={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
