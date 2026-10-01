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

  const dateValue = completedAt || attempt.createdAt;
  const dateObj = dateValue ? new Date(dateValue) : null;
  const isValidDate = dateObj && !isNaN(dateObj.getTime());
  const completedDateFormatted = isValidDate
    ? dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';
  const completedTimeFormatted = isValidDate
    ? dateObj.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
  const fullTimestamp = isValidDate ? dateObj.toLocaleString() : undefined;

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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 animate-fade-in space-y-5 sm:space-y-8">
      {/* ── Breadcrumb & Top Navigation ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between sm:gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-text-secondary flex-wrap min-h-[44px] sm:min-h-0">
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
              <span className="font-semibold text-text-primary truncate max-w-[120px] sm:max-w-xs">{course.title}</span>
            </>
          )}
          {video && (
            <>
              <span>/</span>
              <span className="truncate max-w-[120px] sm:max-w-xs">{video.title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={RotateCcw}
            onClick={handleRetake}
            className="flex-1 sm:flex-initial justify-center text-xs sm:text-sm"
          >
            Retake
          </Button>

          {courseId && (
            <Link to={`/course/${courseId}/quizzes`} className="flex-1 sm:flex-initial">
              <Button variant="secondary" size="sm" icon={Layers} className="w-full justify-center">
                <span className="hidden sm:inline">Course Quizzes</span>
                <span className="sm:hidden">Quizzes</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Top Score & Details Hero Card ── */}
      <div
        className={`rounded-2xl border p-3 sm:p-6 md:p-7 backdrop-blur-md shadow-xl transition-all ${
          passed
            ? 'border-accent-success/40 bg-gradient-to-br from-accent-success/15 via-bg-secondary/80 to-bg-secondary'
            : 'border-accent-warm/40 bg-gradient-to-br from-accent-warm/15 via-bg-secondary/80 to-bg-secondary'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                passed
                  ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                  : 'bg-accent-warm/20 text-accent-warm border border-accent-warm/30'
              }`}
            >
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Attempt #{attemptNumber} of {allAttempts.length}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    passed
                      ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                      : 'bg-accent-warm/20 text-accent-warm border border-accent-warm/30'
                  }`}
                >
                  {passed ? '✓ Passed (≥60%)' : '⚡ Needs Practice'}
                </span>
              </div>

              <h1 className="text-base sm:text-xl font-bold text-text-primary tracking-tight leading-snug break-words">
                {video?.title || 'Lesson Quiz Review'}
              </h1>
              <p className="text-xs text-text-secondary truncate">
                Course: <strong className="text-text-primary font-medium">{course?.title}</strong>
              </p>
            </div>
          </div>

          {/* Big Score Display */}
          <div className="flex items-center gap-3 sm:gap-5 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-bg-primary/70 border border-border-default self-start md:self-center shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Score</span>
              <p className="text-lg sm:text-xl font-black font-mono text-text-primary">
                {score} <span className="text-xs font-normal text-text-tertiary">/ {total}</span>
              </p>
            </div>
            <div className="w-px h-8 bg-border-default" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Accuracy</span>
              <p
                className={`text-lg sm:text-xl font-black font-mono ${
                  passed ? 'text-accent-success' : 'text-accent-warm'
                }`}
              >
                {percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Strip: Perfectly Aligned Time, Date, Correct & Incorrect */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border-default/60">
          {/* Time Taken */}
          <div className="flex flex-col justify-between h-full p-2.5 sm:p-3.5 rounded-xl bg-bg-primary/50 border border-border-subtle hover:border-border-default transition-colors">
            <div className="flex items-center gap-1.5 text-text-tertiary mb-1.5 sm:mb-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-secondary shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium text-text-secondary truncate">Time Taken</span>
            </div>
            <div>
              <p className="font-mono text-sm sm:text-base font-bold text-text-primary leading-tight">
                {formatSeconds(timeTakenSeconds)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-text-tertiary mt-0.5 truncate">
                Total duration
              </p>
            </div>
          </div>

          {/* Date Completed */}
          <div className="flex flex-col justify-between h-full p-2.5 sm:p-3.5 rounded-xl bg-bg-primary/50 border border-border-subtle hover:border-border-default transition-colors">
            <div className="flex items-center gap-1.5 text-text-tertiary mb-1.5 sm:mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-primary shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium text-text-secondary truncate">Date Completed</span>
            </div>
            <div>
              <p
                className="text-xs sm:text-sm font-bold text-text-primary leading-tight truncate"
                title={fullTimestamp}
              >
                {completedDateFormatted}
              </p>
              <p className="text-[10px] sm:text-[11px] text-text-tertiary font-mono mt-0.5 truncate">
                {completedTimeFormatted || 'Recorded'}
              </p>
            </div>
          </div>

          {/* Correct */}
          <div className="flex flex-col justify-between h-full p-2.5 sm:p-3.5 rounded-xl bg-accent-success/10 border border-accent-success/20 hover:border-accent-success/35 transition-colors">
            <div className="flex items-center gap-1.5 text-accent-success mb-1.5 sm:mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium truncate">Correct</span>
            </div>
            <div>
              <p className="font-mono text-sm sm:text-base font-bold text-accent-success leading-tight">
                {correctCount} <span className="text-xs font-normal opacity-70">/ {total}</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-accent-success/80 font-medium mt-0.5 truncate">
                {total > 0 ? Math.round((correctCount / total) * 100) : 0}% accuracy
              </p>
            </div>
          </div>

          {/* Incorrect */}
          <div className="flex flex-col justify-between h-full p-2.5 sm:p-3.5 rounded-xl bg-accent-danger/10 border border-accent-danger/20 hover:border-accent-danger/35 transition-colors">
            <div className="flex items-center gap-1.5 text-accent-danger mb-1.5 sm:mb-2">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-[11px] sm:text-xs font-medium truncate">Incorrect</span>
            </div>
            <div>
              <p className="font-mono text-sm sm:text-base font-bold text-accent-danger leading-tight">
                {incorrectCount} <span className="text-xs font-normal opacity-70">/ {total}</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-accent-danger/80 font-medium mt-0.5 truncate">
                {total > 0 ? Math.round((incorrectCount / total) * 100) : 0}% incorrect
              </p>
            </div>
          </div>
        </div>

        {/* Attempt Switcher if multiple attempts exist */}
        {allAttempts.length > 1 && (
          <div className="mt-5 pt-4 border-t border-border-default/60 flex flex-col xs:flex-row xs:flex-wrap items-start xs:items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-text-tertiary flex items-center gap-1.5">
              <span>Switch Attempt Record:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-thin max-w-full pb-1 xs:pb-0">
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border-default">
          <h2 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary shrink-0" />
            <span>Question Breakdown</span>
          </h2>
          <span className="text-xs text-text-tertiary font-mono">
            {answers.length} Questions
          </span>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {answers.map((item, idx) => {
            const isCorrect = item.isCorrect;

            return (
              <Card
                key={item.questionId || idx}
                padding="none"
                className={`transition-all p-3 sm:p-5 md:p-8 ${
                  isCorrect
                    ? 'border-accent-success/40 bg-bg-secondary/60'
                    : 'border-accent-danger/40 bg-bg-secondary/60'
                }`}
              >
                {/* Question Statement */}
                <div className="flex items-start gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
                  <div
                    className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-bold ${
                      isCorrect
                        ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                        : 'bg-accent-danger/20 text-accent-danger border border-accent-danger/30'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      Question {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold text-text-primary leading-snug sm:leading-relaxed">
                      {item.question}
                    </h3>
                  </div>
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 pl-0 sm:pl-11">
                  {item.options?.map((opt, optIdx) => {
                    const isUserSelection = item.selectedOption === optIdx;
                    const isCorrectAnswer = item.correctAnswer === optIdx;

                    let cardStyle =
                      'border-border-default/60 bg-bg-primary/50 text-text-secondary';
                    let badge = null;

                    if (isCorrectAnswer) {
                      cardStyle =
                        'border-accent-success bg-accent-success/15 text-accent-success font-semibold shadow-sm';
                      badge = isUserSelection ? '✓ Your Pick' : '✓ Correct';
                    } else if (isUserSelection && !isCorrectAnswer) {
                      cardStyle =
                        'border-accent-danger bg-accent-danger/15 text-accent-danger font-semibold shadow-sm';
                      badge = '✗ Your Pick';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border text-xs flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 ${cardStyle}`}
                      >
                        <div className="flex items-start xs:items-center gap-2 min-w-0">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-bg-primary/80 flex items-center justify-center font-mono text-[10px] sm:text-[11px] font-bold shrink-0 opacity-80 mt-0.5 xs:mt-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug break-words">{opt}</span>
                        </div>

                        {badge && (
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold shrink-0 px-1.5 sm:px-2 py-0.5 rounded bg-bg-primary/70 border border-current self-start xs:self-center whitespace-nowrap">
                            {badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* AI Explanation Card */}
                {item.explanation && (
                  <div className="ml-0 sm:ml-11 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-bg-tertiary/40 border border-border-default text-xs text-text-secondary leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-text-primary mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                      <span>Explanation:</span>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-5 rounded-2xl bg-bg-secondary border border-border-default">
        <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
          {prevAttempt && (
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              onClick={() => navigate(`/quiz/attempt/${prevAttempt._id}`)}
              className="text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">Previous</span> #{prevAttempt.attemptNumber}
            </Button>
          )}

          {nextAttempt && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/quiz/attempt/${nextAttempt._id}`)}
              className="text-xs sm:text-sm"
            >
              <span><span className="hidden xs:inline">Next</span> #{nextAttempt.attemptNumber}</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            icon={RotateCcw}
            onClick={handleRetake}
            className="flex-1 sm:flex-initial justify-center text-xs sm:text-sm"
          >
            Retake Quiz
          </Button>

          <Link to={courseId ? `/course/${courseId}/quizzes` : '/progress'} className="flex-1 sm:flex-initial">
            <Button variant="secondary" size="sm" className="w-full justify-center text-xs sm:text-sm">
              {courseId ? 'Quizzes' : 'Progress'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
