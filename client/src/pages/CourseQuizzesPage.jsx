import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Clock,
  History,
  RotateCcw,
  Eye,
  Play,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { quizAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';

function formatSeconds(sec = 0) {
  if (!sec || sec <= 0) return '< 1m';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function CourseQuizzesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active view tab: 'quizzes' (All Quizzes) | 'history' (Attempt History)
  const [activeTab, setActiveTab] = useState('quizzes');
  // Filter for quizzes list: 'all' | 'attempted' | 'unattempted' | 'passed'
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchCourseQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quizAPI.getByCourse(id);
      setData(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course quizzes.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseQuizzes();
  }, [fetchCourseQuizzes]);

  // Navigate directly to dedicated Quiz Taking page (in retake mode if requested)
  const handleTakeQuiz = (videoId, isRetake = false) => {
    navigate(`/course/${id}/quiz/${videoId}${isRetake ? '?retake=true' : ''}`);
  };

  const { course, stats, lessons = [], attempts = [] } = data || {};

  // Filter lessons with quiz
  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    if (statusFilter === 'attempted') {
      return lessons.filter((l) => l.attemptsCount > 0);
    }
    if (statusFilter === 'unattempted') {
      return lessons.filter((l) => l.attemptsCount === 0);
    }
    if (statusFilter === 'passed') {
      return lessons.filter((l) => l.bestAttempt?.passed);
    }
    return lessons;
  }, [lessons, statusFilter]);

  if (loading) {
    return <Loader fullPage text="Loading course quizzes & assessment history..." />;
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-accent-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-sm text-text-secondary mb-6">{error || 'Course not found.'}</p>
        <Button onClick={() => navigate(`/course/${id}`)} icon={ArrowLeft}>
          Back to Course Page
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* ── Top Breadcrumbs & Back Nav ── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={`/course/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {course.title}</span>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          icon={Play}
          onClick={() => navigate(`/study/${id}`)}
        >
          Resume Study Room
        </Button>
      </div>

      {/* ── Course Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-bg-secondary via-bg-secondary/90 to-bg-primary border border-border-default shadow-lg">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-bg-tertiary shrink-0 border border-border-default">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                <BookOpen className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment &amp; Quiz Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs text-text-secondary">
              Channel: <span className="text-text-primary font-medium">{course.channelTitle}</span> •{' '}
              {stats?.totalLessons} lessons total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <Button
            variant="primary"
            icon={Play}
            size="md"
            onClick={() => navigate(`/study/${id}?tab=quiz`)}
          >
            Launch Active Quiz
          </Button>
        </div>
      </div>

      {/* ── Course Quiz Performance Summary Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Mastery */}
        <Card padding="sm" className="space-y-1 border-accent-primary/30 bg-accent-primary/5">
          <span className="text-[10px] text-accent-primary font-bold uppercase tracking-wider">
            Quiz Mastery
          </span>
          <p className="text-2xl font-bold font-mono text-accent-primary">
            {stats?.overallCourseQuizAverage || 0}%
          </p>
          <p className="text-[11px] text-text-tertiary">Course average</p>
        </Card>

        {/* Quizzes Attempted */}
        <Card padding="sm" className="space-y-1">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
            Quizzes Tested
          </span>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {stats?.totalQuizzesAttempted || 0} / {stats?.totalLessons || 0}
          </p>
          <p className="text-[11px] text-text-tertiary">Lessons completed</p>
        </Card>

        {/* Total Attempts */}
        <Card padding="sm" className="space-y-1">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
            Total Attempts
          </span>
          <p className="text-2xl font-bold font-mono text-accent-secondary">
            {stats?.totalAttemptsCount || 0}
          </p>
          <p className="text-[11px] text-text-tertiary">Submissions made</p>
        </Card>

        {/* Pass Rate */}
        <Card padding="sm" className="space-y-1 border-accent-success/30 bg-accent-success/5">
          <span className="text-[10px] text-accent-success font-bold uppercase tracking-wider">
            Pass Rate
          </span>
          <p className="text-2xl font-bold font-mono text-accent-success">
            {stats?.passRate || 0}%
          </p>
          <p className="text-[11px] text-text-tertiary">
            {stats?.passedAttemptsCount || 0} passed
          </p>
        </Card>

        {/* Perfect Scores */}
        <Card padding="sm" className="space-y-1 border-accent-warm/30 bg-accent-warm/5">
          <span className="text-[10px] text-accent-warm font-bold uppercase tracking-wider">
            Perfect Scores
          </span>
          <p className="text-2xl font-bold font-mono text-accent-warm flex items-center gap-1">
            <Trophy className="w-4 h-4 inline" />
            {stats?.perfectScoresCount || 0}
          </p>
          <p className="text-[11px] text-text-tertiary">100% achievements</p>
        </Card>

        {/* Average Time */}
        <Card padding="sm" className="space-y-1">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
            Avg Time / Quiz
          </span>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {formatSeconds(stats?.averageTimeSeconds)}
          </p>
          <p className="text-[11px] text-text-tertiary">Pace per attempt</p>
        </Card>
      </div>

      {/* ── Main Tab Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'quizzes'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>All Course Quizzes ({lessons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Separate Attempt Records ({attempts.length})</span>
          </button>
        </div>

        {/* Quizzes list filter tabs */}
        {activeTab === 'quizzes' && (
          <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-xl border border-border-default text-xs font-semibold">
            {[
              { id: 'all', label: 'All' },
              { id: 'attempted', label: 'Attempted' },
              { id: 'unattempted', label: 'Unattempted' },
              { id: 'passed', label: 'Passed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  statusFilter === f.id
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: ALL QUIZZES IN COURSE                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'quizzes' && (
        <div className="space-y-3">
          {filteredLessons.length === 0 ? (
            <Card className="text-center py-12">
              <Sparkles className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <h3 className="text-base font-bold text-text-primary mb-1">
                No quizzes match filter &ldquo;{statusFilter}&rdquo;
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
                Try selecting a different filter above to view your course quizzes.
              </p>
              <Button size="sm" variant="secondary" onClick={() => setStatusFilter('all')}>
                Show All Lessons
              </Button>
            </Card>
          ) : (
            filteredLessons.map((item, index) => {
              const { video, hasQuiz, totalQuestions, attemptsCount, bestAttempt } =
                item;

              return (
                <Card
                  key={video._id}
                  padding="md"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-accent-primary/40 bg-bg-secondary/70 hover:bg-bg-secondary"
                >
                  {/* Left: Lesson Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-border-default flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                      {video.position || index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-text-primary">
                          {video.title}
                        </h4>
                        {bestAttempt ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              bestAttempt.passed
                                ? 'bg-accent-success/15 text-accent-success border border-accent-success/25'
                                : 'bg-accent-warm/15 text-accent-warm border border-accent-warm/25'
                            }`}
                          >
                            {bestAttempt.passed ? '✓ Passed' : 'Needs Practice'}
                          </span>
                        ) : hasQuiz ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/25">
                            Quiz Ready ({totalQuestions} Qs)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-tertiary text-text-tertiary">
                            AI Ready
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.durationSeconds)}
                        </span>
                        {attemptsCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-text-secondary">
                              {attemptsCount} {attemptsCount === 1 ? 'attempt' : 'attempts'} recorded
                            </span>
                            {bestAttempt && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-accent-warm font-semibold">
                                  Best: {bestAttempt.score}/{bestAttempt.total} ({bestAttempt.percentage}%)
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border-default/60">
                    {bestAttempt && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/quiz/attempt/${bestAttempt._id}`)}
                      >
                        Review Best
                      </Button>
                    )}

                    <Button
                      variant={attemptsCount > 0 ? 'secondary' : 'primary'}
                      size="sm"
                      icon={attemptsCount > 0 ? RotateCcw : Play}
                      onClick={() =>
                        handleTakeQuiz(video.videoId || video._id, attemptsCount > 0)
                      }
                    >
                      {attemptsCount > 0 ? 'Retake Quiz' : 'Take Quiz'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: SEPARATE ATTEMPT RECORDS (COURSE HISTORY)            */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <Card className="text-center py-12">
              <History className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <h3 className="text-base font-bold text-text-primary mb-1">
                No Quiz Attempts in this Course Yet
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
                Take any lesson quiz in this course to test your knowledge. Each attempt will be
                recorded here with detailed answer evaluations.
              </p>
              <Button size="sm" variant="primary" onClick={() => setActiveTab('quizzes')}>
                Browse Course Quizzes
              </Button>
            </Card>
          ) : (
            <Card padding="none" className="overflow-hidden shadow-lg">
              <div className="p-4 border-b border-border-default/80 flex items-center justify-between bg-bg-secondary">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <History className="w-4 h-4 text-accent-primary" />
                  All Attempt Records for {course.title}
                </h4>
                <span className="text-xs text-text-tertiary font-mono">
                  {attempts.length} total attempts
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-primary/80 border-b border-border-default text-text-tertiary uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3.5">Lesson</th>
                      <th className="p-3.5">Attempt</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Percentage</th>
                      <th className="p-3.5">Time Taken</th>
                      <th className="p-3.5">Date &amp; Time</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/50">
                    {attempts.map((att) => {
                      const lessonTitle = att.videoId?.title || 'Lesson';
                      const lessonVidId = att.videoId?.videoId || att.videoId?._id;

                      return (
                        <tr
                          key={att._id}
                          className="hover:bg-bg-primary/40 transition-colors duration-150"
                        >
                          <td className="p-3.5 max-w-xs">
                            <p className="font-semibold text-text-primary truncate">
                              {lessonTitle}
                            </p>
                          </td>
                          <td className="p-3.5 font-bold font-mono text-text-primary whitespace-nowrap">
                            Attempt #{att.attemptNumber}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-text-primary whitespace-nowrap">
                            {att.score} / {att.total}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`font-mono font-bold ${
                                att.passed ? 'text-accent-success' : 'text-accent-warm'
                              }`}
                            >
                              {att.percentage}%
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-text-secondary whitespace-nowrap">
                            {formatSeconds(att.timeTakenSeconds)}
                          </td>
                          <td className="p-3.5 text-text-secondary whitespace-nowrap">
                            {new Date(att.completedAt || att.createdAt).toLocaleString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                att.passed
                                  ? 'bg-accent-success/15 text-accent-success border border-accent-success/25'
                                  : 'bg-accent-warm/15 text-accent-warm border border-accent-warm/25'
                              }`}
                            >
                              {att.passed ? 'Passed' : 'Needs Review'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={Eye}
                                onClick={() => navigate(`/quiz/attempt/${att._id}`)}
                              >
                                Review
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={RotateCcw}
                                onClick={() => handleTakeQuiz(lessonVidId, true)}
                                title="Retake this quiz immediately"
                              >
                                Retake
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
