import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Award,
  BookOpen,
  Sparkles,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
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

export default function QuizReviewPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttempt = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quizAPI.getAttemptById(attemptId);
      setData(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz attempt details.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchAttempt();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchAttempt]);

  if (loading) {
    return <Loader fullPage text="Loading full quiz review details..." />;
  }

  if (error || !data?.attempt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-accent-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-sm text-text-secondary mb-6">{error || 'Attempt record not found.'}</p>
        <Button onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
      </div>
    );
  }

  const { attempt, allAttempts = [] } = data;
  const course = attempt.courseId;
  const video = attempt.videoId;
  const courseId = course?._id;
  const videoId = video?.videoId || video?._id;

  const {
    attemptNumber = 1,
    score = 0,
    total = 0,
    percentage = 0,
    passed = false,
    timeTakenSeconds = 0,
    completedAt,
    answers = [],
  } = attempt;

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const incorrectCount = total - correctCount;

  // Sorting all attempts in ascending order for prev/next
  const sortedAttempts = [...allAttempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const currentIndex = sortedAttempts.findIndex((a) => a._id === attempt._id);
  const prevAttempt = currentIndex > 0 ? sortedAttempts[currentIndex - 1] : null;
  const nextAttempt =
    currentIndex >= 0 && currentIndex < sortedAttempts.length - 1
      ? sortedAttempts[currentIndex + 1]
      : null;

  const handleRetake = () => {
    // Navigate directly to dedicated quiz taking page in retake mode
    if (courseId) {
      navigate(`/course/${courseId}/quiz/${videoId}?retake=true`);
    } else {
      navigate(`/quiz/${videoId}?retake=true`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* ── Breadcrumb & Top Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
          <Link
            to={courseId ? `/course/${courseId}/quizzes` : '/progress'}
            className="hover:text-accent-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{courseId ? 'All Course Quizzes' : 'Progress & Analytics'}</span>
          </Link>
          {course && (
            <>
              <span>/</span>
              <span className="font-semibold text-text-primary truncate max-w-xs">{course.title}</span>
            </>
          )}
          {video && (
            <>
              <span>/</span>
              <span className="truncate max-w-xs">{video.title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={RotateCcw}
            onClick={handleRetake}
          >
            Retake Quiz
          </Button>

          {courseId && (
            <Link to={`/course/${courseId}/quizzes`}>
              <Button variant="secondary" size="sm" icon={Layers}>
                Course Quizzes
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Top Score & Details Hero Card ── */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-md shadow-xl transition-all ${
          passed
            ? 'border-accent-success/40 bg-gradient-to-br from-accent-success/15 via-bg-secondary/80 to-bg-secondary'
            : 'border-accent-warm/40 bg-gradient-to-br from-accent-warm/15 via-bg-secondary/80 to-bg-secondary'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                passed
                  ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                  : 'bg-accent-warm/20 text-accent-warm border border-accent-warm/30'
              }`}
            >
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Attempt #{attemptNumber} of {allAttempts.length}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    passed
                      ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                      : 'bg-accent-warm/20 text-accent-warm border border-accent-warm/30'
                  }`}
                >
                  {passed ? '✓ Passed (≥60%)' : '⚡ Needs Practice'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                {video?.title || 'Lesson Quiz Review'}
              </h1>
              <p className="text-xs text-text-secondary">
                Course: <strong className="text-text-primary">{course?.title}</strong>
              </p>
            </div>
          </div>

          {/* Big Score Display */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-bg-primary/70 border border-border-default self-start md:self-center shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase text-text-tertiary">Score</span>
              <p className="text-2xl font-black font-mono text-text-primary">
                {score} <span className="text-sm font-normal text-text-tertiary">/ {total}</span>
              </p>
            </div>
            <div className="w-px h-10 bg-border-default" />
            <div>
              <span className="text-[10px] font-bold uppercase text-text-tertiary">Accuracy</span>
              <p
                className={`text-2xl font-black font-mono ${
                  passed ? 'text-accent-success' : 'text-accent-warm'
                }`}
              >
                {percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border-default/60 text-xs">
          <div className="p-3 rounded-xl bg-bg-primary/50 border border-border-subtle">
            <span className="text-text-tertiary flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-accent-secondary" />
              Time Taken:
            </span>
            <span className="font-bold text-text-primary font-mono text-sm">
              {formatSeconds(timeTakenSeconds)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-bg-primary/50 border border-border-subtle">
            <span className="text-text-tertiary flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-accent-primary" />
              Date Completed:
            </span>
            <span className="font-semibold text-text-primary text-xs">
              {completedAt
                ? new Date(completedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-accent-success/10 border border-accent-success/20">
            <span className="text-accent-success flex items-center gap-1 mb-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Correct Answers:
            </span>
            <span className="font-bold text-accent-success font-mono text-sm">
              {correctCount} of {total}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/20">
            <span className="text-accent-danger flex items-center gap-1 mb-1 font-semibold">
              <XCircle className="w-3.5 h-3.5" />
              Incorrect Answers:
            </span>
            <span className="font-bold text-accent-danger font-mono text-sm">
              {incorrectCount} of {total}
            </span>
          </div>
        </div>

        {/* Attempt Switcher if multiple attempts exist */}
        {allAttempts.length > 1 && (
          <div className="mt-5 pt-4 border-t border-border-default/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-text-tertiary flex items-center gap-1.5">
              <span>Switch Attempt Record:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {allAttempts.map((att) => {
                const isCurrent = att._id === attempt._id;

                return (
                  <button
                    key={att._id}
                    onClick={() => navigate(`/quiz/attempt/${att._id}`)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-accent-primary text-white shadow-sm ring-1 ring-accent-primary'
                        : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border-default'
                    }`}
                  >
                    Attempt #{att.attemptNumber} ({att.percentage}%)
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Complete Question-by-Question Full Page Review ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-default">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-primary" />
            <span>Complete Question Breakdown &amp; Explanations</span>
          </h2>
          <span className="text-xs text-text-tertiary font-mono">
            {answers.length} Questions Evaluated
          </span>
        </div>

        <div className="space-y-5">
          {answers.map((item, idx) => {
            const isCorrect = item.isCorrect;

            return (
              <Card
                key={item.questionId || idx}
                padding="lg"
                className={`transition-all ${
                  isCorrect
                    ? 'border-accent-success/40 bg-bg-secondary/60'
                    : 'border-accent-danger/40 bg-bg-secondary/60'
                }`}
              >
                {/* Question Statement */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isCorrect
                        ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                        : 'bg-accent-danger/20 text-accent-danger border border-accent-danger/30'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      Question {idx + 1}
                    </span>
                    <h3 className="text-base font-semibold text-text-primary leading-relaxed">
                      {item.question}
                    </h3>
                  </div>
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pl-0 sm:pl-11">
                  {item.options?.map((opt, optIdx) => {
                    const isUserSelection = item.selectedOption === optIdx;
                    const isCorrectAnswer = item.correctAnswer === optIdx;

                    let cardStyle =
                      'border-border-default/60 bg-bg-primary/50 text-text-secondary';
                    let badge = null;

                    if (isCorrectAnswer) {
                      cardStyle =
                        'border-accent-success bg-accent-success/15 text-accent-success font-semibold shadow-sm';
                      badge = isUserSelection ? '✓ Correct Choice (Your Choice)' : '✓ Correct Answer';
                    } else if (isUserSelection && !isCorrectAnswer) {
                      cardStyle =
                        'border-accent-danger bg-accent-danger/15 text-accent-danger font-semibold shadow-sm';
                      badge = '✗ Your Choice';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${cardStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-bg-primary/80 flex items-center justify-center font-mono text-[11px] font-bold shrink-0 opacity-80">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>

                        {badge && (
                          <span className="text-[10px] uppercase font-bold shrink-0 px-2 py-0.5 rounded bg-bg-primary/70 border border-current">
                            {badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* AI Explanation Card */}
                {item.explanation && (
                  <div className="ml-0 sm:ml-11 p-4 rounded-xl bg-bg-tertiary/40 border border-border-default text-xs text-text-secondary leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-text-primary mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                      <span>Conceptual Explanation:</span>
                    </div>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Actions & Pagination Footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-bg-secondary border border-border-default">
        <div className="flex items-center gap-2">
          {prevAttempt && (
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              onClick={() => navigate(`/quiz/attempt/${prevAttempt._id}`)}
            >
              Previous Attempt (#{prevAttempt.attemptNumber})
            </Button>
          )}

          {nextAttempt && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/quiz/attempt/${nextAttempt._id}`)}
            >
              <span>Next Attempt (#{nextAttempt.attemptNumber})</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={RotateCcw}
            onClick={handleRetake}
          >
            Retake Quiz Now
          </Button>

          <Link to={courseId ? `/course/${courseId}/quizzes` : '/progress'}>
            <Button variant="secondary">
              {courseId ? 'Back to Course Quizzes' : 'Back to Progress'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
