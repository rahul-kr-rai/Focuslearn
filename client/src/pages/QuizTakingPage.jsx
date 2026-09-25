import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Clock,
  History,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Play,
  Calendar,
  Layers,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { quizAPI, courseAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';

function formatSeconds(sec = 0) {
  if (!sec || sec <= 0) return '0s';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatTimer(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function QuizTakingPage() {
  const { courseId, videoId } = useParams();
  const [searchParams] = useSearchParams();
  const isRetakeRequested = searchParams.get('retake') === 'true';
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [latestAttempt, setLatestAttempt] = useState(null);
  const [bestAttempt, setBestAttempt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Active view mode: 'take' | 'review' | 'history' | 'compare'
  const [viewMode, setViewMode] = useState('take');

  // Interactive taking state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Newly submitted result
  const [justSubmittedAttempt, setJustSubmittedAttempt] = useState(null);

  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await quizAPI.getByVideo(videoId);
      const data = res.data?.data || {};

      setQuiz(data.quiz);
      const fetchedAttempts = data.attempts || [];
      setAttempts(fetchedAttempts);
      setLatestAttempt(data.latestAttempt || null);
      setBestAttempt(data.bestAttempt || null);

      // Fetch course info if courseId is in params or returned with quiz
      const effectiveCourseId = courseId || data.quiz?.courseId;
      if (effectiveCourseId) {
        courseAPI
          .getById(effectiveCourseId)
          .then((cRes) => {
            setCourse(cRes.data?.data?.course);
          })
          .catch((cErr) => console.error('Course info error:', cErr));
      }

      if (isRetakeRequested || fetchedAttempts.length === 0) {
        // Start interactive quiz taking immediately!
        setViewMode('take');
        setSelectedAnswers({});
        setCurrentQuestionIdx(0);
        setTimerSeconds(0);
        setIsTimerRunning(true);
      } else {
        // Show latest result review by default if not explicitly retaking
        setViewMode('review');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz details.');
    } finally {
      setLoading(false);
    }
  }, [courseId, videoId, isRetakeRequested]);

  useEffect(() => {
    fetchQuizData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchQuizData]);

  // Live stopwatch
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Start fresh attempt immediately
  const handleStartRetake = () => {
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setViewMode('take');
    setJustSubmittedAttempt(null);
  };

  // Generate quiz if not yet generated
  const handleGenerateQuiz = async (forceRegenerate = false) => {
    try {
      setGenerating(true);
      setError(null);
      setSelectedAnswers({});
      setCurrentQuestionIdx(0);
      setTimerSeconds(0);
      setIsTimerRunning(false);

      const res = await quizAPI.generate(videoId, forceRegenerate);
      setQuiz(res.data?.data?.quiz);
      setAttempts([]);
      setLatestAttempt(null);
      setBestAttempt(null);
      handleStartRetake();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI quiz.');
    } finally {
      setGenerating(false);
    }
  };

  // Select an option
  const handleSelectOption = (optionIdx) => {
    if (viewMode !== 'take') return;
    if (!isTimerRunning) setIsTimerRunning(true);
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIdx,
    }));
  };

  // Submit quiz answers
  const handleSubmitQuiz = async () => {
    if (!quiz || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      setIsTimerRunning(false);

      const formattedAnswers = quiz.questions.map((_, idx) =>
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
      );

      const payload = {
        answers: formattedAnswers,
        timeTakenSeconds: timerSeconds,
      };

      const res = await quizAPI.submit(quiz._id, payload);
      const resultData = res.data?.data;

      const newAttempt = {
        _id: resultData.attemptId,
        attemptNumber: resultData.attemptNumber,
        score: resultData.score,
        total: resultData.total,
        percentage: resultData.percentage,
        passed: resultData.passed,
        timeTakenSeconds: resultData.timeTakenSeconds,
        completedAt: resultData.completedAt,
        answers: resultData.results,
        improvementDelta: resultData.improvementDelta,
        isNewBest: resultData.isNewBest,
      };

      const updatedAttempts = resultData.allAttempts || [newAttempt, ...attempts];
      setAttempts(updatedAttempts);
      setLatestAttempt(newAttempt);
      setJustSubmittedAttempt(newAttempt);

      const newBest = [...updatedAttempts].sort(
        (a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds
      )[0];
      setBestAttempt(newBest);

      setViewMode('review');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz.');
      setIsTimerRunning(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Comparison metrics across attempts
  const comparisonStats = useMemo(() => {
    if (attempts.length === 0) return null;

    const totalAttempts = attempts.length;
    const sortedChronological = [...attempts].sort(
      (a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt)
    );

    const first = sortedChronological[0];
    const latest = sortedChronological[sortedChronological.length - 1];
    const overallDelta = latest.percentage - first.percentage;

    return {
      totalAttempts,
      first,
      latest,
      overallDelta,
      sortedChronological,
    };
  }, [attempts]);

  if (loading) {
    return <Loader fullPage text="Loading dedicated quiz workspace..." />;
  }

  if (generating) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center animate-pulse">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center text-white shadow-xl shadow-accent-primary/25 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Generating AI Quiz with Gemini...
        </h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto mb-4">
          Analyzing lesson material, extracting conceptual objectives, and formulating 5 questions with verified explanations.
        </p>
        <div className="flex justify-center items-center gap-2 text-xs text-accent-secondary font-medium">
          <Zap className="w-4 h-4 animate-spin" />
          <span>Synthesizing questions &amp; answer choices</span>
        </div>
      </div>
    );
  }

  // If quiz is not generated yet
  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-primary mx-auto shadow-md">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-text-primary mb-2">
            Quiz Not Generated Yet
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Click below to generate a tailored 5-question multiple-choice quiz using Gemini AI for this lesson.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/20 text-xs text-accent-danger max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="primary"
            icon={Sparkles}
            onClick={() => handleGenerateQuiz(false)}
            size="lg"
          >
            Generate AI Quiz Now
          </Button>

          {courseId && (
            <Link to={`/course/${courseId}/quizzes`}>
              <Button variant="secondary" size="lg">
                Back to All Quizzes
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const activeReviewAttempt = justSubmittedAttempt || latestAttempt;
  const activeCourseId = courseId || course?._id || quiz?.courseId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* ── Top Navigation & Breadcrumbs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
          {activeCourseId ? (
            <Link
              to={`/course/${activeCourseId}/quizzes`}
              className="hover:text-accent-primary transition-colors flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Course Quizzes</span>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="hover:text-accent-primary transition-colors flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          )}
          {course && (
            <>
              <span>/</span>
              <span className="truncate max-w-xs">{course.title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeCourseId && (
            <Link
              to={`/study/${activeCourseId}?video=${videoId}`}
              className="text-xs text-text-tertiary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border-default hover:bg-bg-secondary transition-all"
            >
              Watch Lesson Video
            </Link>
          )}
          {bestAttempt && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-warm/10 border border-accent-warm/25 text-accent-warm text-xs font-bold font-mono">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                Best: {bestAttempt.score}/{bestAttempt.total} ({bestAttempt.percentage}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Header Title & Mode Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-secondary border border-border-default shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-primary mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Quiz Workspace</span>
          </div>
          <h1 className="text-xl font-black text-text-primary tracking-tight">
            Lesson Assessment
          </h1>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={handleStartRetake}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'take'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{attempts.length > 0 ? 'Retake Quiz' : 'Take Quiz'}</span>
          </button>

          {activeReviewAttempt && (
            <button
              onClick={() => setViewMode('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'review'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Result Summary</span>
            </button>
          )}

          {attempts.length > 0 && (
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'history'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Attempts ({attempts.length})</span>
            </button>
          )}

          {attempts.length >= 2 && (
            <button
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'compare'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 1: ACTIVE QUIZ TAKING (Direct, No Video Player)         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'take' && (
        <div className="rounded-2xl border border-border-default bg-bg-secondary/70 backdrop-blur-md p-6 sm:p-8 transition-all shadow-xl space-y-6 animate-fade-in">
          {/* Quiz Stepper & Timer Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
            <div>
              <span className="text-xs font-bold text-accent-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {attempts.length > 0 ? `Retake (Attempt #${attempts.length + 1})` : 'Attempt #1'}
              </span>
              <h3 className="text-base font-bold text-text-primary mt-0.5">
                Question {currentQuestionIdx + 1} of {totalQ}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Live stopwatch */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-primary border border-border-default font-mono text-xs text-text-primary">
                <Clock className="w-3.5 h-3.5 text-accent-secondary" />
                <span>{formatTimer(timerSeconds)}</span>
              </div>

              {/* Jumper pills */}
              <div className="flex items-center gap-1.5">
                {questions.map((_, i) => {
                  const isAnswered = selectedAnswers[i] !== undefined;
                  const isCurrent = currentQuestionIdx === i;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentQuestionIdx(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-accent-primary text-white shadow-sm scale-105'
                          : isAnswered
                          ? 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'
                          : 'bg-bg-tertiary text-text-tertiary hover:text-text-primary'
                      }`}
                      title={`Jump to Question ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
              style={{ width: `${((currentQuestionIdx + 1) / totalQ) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          {currentQ && (
            <div className="py-2">
              <p className="text-lg sm:text-xl font-bold text-text-primary leading-relaxed">
                {currentQ.question}
              </p>
            </div>
          )}

          {/* Options */}
          {currentQ && (
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center gap-4 cursor-pointer group ${
                      isSelected
                        ? 'border-accent-primary bg-accent-primary/15 text-text-primary shadow-md ring-1 ring-accent-primary'
                        : 'border-border-default/70 bg-bg-primary/50 text-text-secondary hover:border-border-default hover:bg-bg-primary/80 hover:text-text-primary'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-accent-primary text-white'
                          : 'bg-bg-tertiary text-text-secondary group-hover:text-text-primary'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm flex-1 leading-normal font-medium">{option}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-accent-primary'
                          : 'border-border-default group-hover:border-text-tertiary'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-xs text-accent-danger">
              {error}
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border-default/60">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIdx === 0}
            >
              Previous
            </Button>

            <div className="text-xs text-text-tertiary font-mono">
              Answered {answeredCount} of {totalQ}
            </div>

            {currentQuestionIdx < totalQ - 1 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentQuestionIdx((prev) => Math.min(totalQ - 1, prev + 1))}
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                loading={submitting}
                disabled={submitting || answeredCount === 0}
                onClick={handleSubmitQuiz}
                className="shadow-md shadow-accent-primary/20"
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 2: RESULT SUMMARY                                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'review' && activeReviewAttempt && (
        <div className="space-y-6 animate-fade-in">
          <div
            className={`rounded-2xl border p-6 md:p-8 text-center backdrop-blur-md transition-all shadow-xl ${
              activeReviewAttempt.passed
                ? 'border-accent-success/40 bg-gradient-to-b from-accent-success/15 via-bg-secondary/70 to-bg-secondary/90'
                : 'border-accent-warm/40 bg-gradient-to-b from-accent-warm/15 via-bg-secondary/70 to-bg-secondary/90'
            }`}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-bg-primary/80 border border-border-default shadow-md">
              <Award
                className={`w-8 h-8 ${
                  activeReviewAttempt.passed ? 'text-accent-success' : 'text-accent-warm'
                }`}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-primary/70 border border-border-default text-xs font-semibold text-text-tertiary mb-2">
              <span>Attempt #{activeReviewAttempt.attemptNumber}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-accent-secondary" />
                {formatSeconds(activeReviewAttempt.timeTakenSeconds)}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-1">
              {activeReviewAttempt.passed ? 'Quiz Passed! 🎉' : 'Keep Practicing! 💪'}
            </h2>
            <p className="text-xs text-text-secondary mb-5 max-w-md mx-auto">
              {activeReviewAttempt.passed
                ? 'You have successfully passed this assessment.'
                : 'Review the detailed answer explanations and retake the quiz to improve your score.'}
            </p>

            <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-bg-primary/70 border border-border-default mb-6">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-text-tertiary">Score</span>
                <p className="text-xl font-black font-mono text-text-primary">
                  {activeReviewAttempt.score} / {activeReviewAttempt.total}
                </p>
              </div>
              <div className="w-px h-8 bg-border-default" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-text-tertiary">Accuracy</span>
                <p
                  className={`text-xl font-black font-mono ${
                    activeReviewAttempt.passed ? 'text-accent-success' : 'text-accent-warm'
                  }`}
                >
                  {activeReviewAttempt.percentage}%
                </p>
              </div>
            </div>

            {/* Improvement delta alert */}
            {activeReviewAttempt.improvementDelta !== undefined &&
              activeReviewAttempt.attemptNumber > 1 && (
                <div className="mb-6">
                  {activeReviewAttempt.improvementDelta > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-success bg-accent-success/10 px-3.5 py-1.5 rounded-full border border-accent-success/20">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{activeReviewAttempt.improvementDelta}% score increase vs previous attempt!
                    </span>
                  ) : activeReviewAttempt.improvementDelta === 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary bg-bg-primary/60 px-3.5 py-1.5 rounded-full">
                      Maintained consistent score
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-accent-warm bg-accent-warm/10 px-3.5 py-1.5 rounded-full border border-accent-warm/20">
                      {activeReviewAttempt.improvementDelta}% compared to previous attempt
                    </span>
                  )}
                </div>
              )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={RotateCcw}
                onClick={handleStartRetake}
              >
                Retake Quiz
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon={Eye}
                onClick={() => navigate(`/quiz/attempt/${activeReviewAttempt._id}`)}
              >
                Open Full-Page Question Review
              </Button>

              {activeCourseId && (
                <Link to={`/course/${activeCourseId}/quizzes`}>
                  <Button variant="ghost" size="md">
                    Course Quizzes
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 3: SEPARATE ATTEMPT RECORDS LIST                       */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <History className="w-4 h-4 text-accent-primary" />
                <span>All Attempt Records for this Quiz</span>
              </h3>
              <p className="text-xs text-text-secondary">
                Inspect any attempt&apos;s full-page review or launch an immediate retake.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleStartRetake}>
              Retake Quiz
            </Button>
          </div>

          <div className="space-y-3">
            {attempts.map((att) => {
              const isBest = bestAttempt?._id === att._id;

              return (
                <Card
                  key={att._id}
                  padding="md"
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-accent-primary/40 ${
                    isBest ? 'border-accent-warm/40 bg-accent-warm/5' : 'bg-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs ${
                        att.passed
                          ? 'bg-accent-success/20 text-accent-success'
                          : 'bg-accent-warm/20 text-accent-warm'
                      }`}
                    >
                      #{att.attemptNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">
                          Attempt #{att.attemptNumber}
                        </span>
                        {isBest && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-warm/20 text-accent-warm border border-accent-warm/30">
                            ★ Best Attempt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(att.completedAt || att.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {formatSeconds(att.timeTakenSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border-default/60">
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-text-primary">
                        {att.score} / {att.total}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          att.passed ? 'text-accent-success' : 'text-accent-warm'
                        }`}
                      >
                        {att.percentage}% ({att.passed ? 'Passed' : 'Practice'})
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => navigate(`/quiz/attempt/${att._id}`)}
                    >
                      Full Review
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 4: COMPARE ATTEMPTS                                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'compare' && comparisonStats && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-primary" />
                <span>Performance Progression</span>
              </h3>
              <p className="text-xs text-text-secondary">
                Track your mastery development across each attempt.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleStartRetake}>
              Retake Quiz
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card padding="sm" className="space-y-1">
              <span className="text-[10px] text-text-tertiary font-bold uppercase">
                First Attempt
              </span>
              <p className="text-xl font-bold font-mono text-text-primary">
                {comparisonStats.first.percentage}%
              </p>
              <p className="text-[11px] text-text-tertiary">
                Score: {comparisonStats.first.score}/{comparisonStats.first.total}
              </p>
            </Card>

            <Card padding="sm" className="space-y-1 border-accent-warm/40 bg-accent-warm/5">
              <span className="text-[10px] text-accent-warm font-bold uppercase">
                Best Attempt
              </span>
              <p className="text-xl font-bold font-mono text-accent-warm">
                {bestAttempt?.percentage}%
              </p>
              <p className="text-[11px] text-text-tertiary">
                Attempt #{bestAttempt?.attemptNumber}
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-[10px] text-text-tertiary font-bold uppercase">
                Latest Attempt
              </span>
              <p className="text-xl font-bold font-mono text-text-primary">
                {comparisonStats.latest.percentage}%
              </p>
              <p className="text-[11px] text-text-tertiary">
                Attempt #{comparisonStats.latest.attemptNumber}
              </p>
            </Card>

            <Card padding="sm" className="space-y-1 border-accent-success/40 bg-accent-success/5">
              <span className="text-[10px] text-accent-success font-bold uppercase">
                Overall Growth
              </span>
              <p
                className={`text-xl font-bold font-mono ${
                  comparisonStats.overallDelta >= 0 ? 'text-accent-success' : 'text-accent-warm'
                }`}
              >
                {comparisonStats.overallDelta >= 0
                  ? `+${comparisonStats.overallDelta}%`
                  : `${comparisonStats.overallDelta}%`}
              </p>
              <p className="text-[11px] text-text-tertiary">Net improvement</p>
            </Card>
          </div>

          <Card padding="md" className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Score Timeline
            </h4>
            <div className="space-y-3">
              {comparisonStats.sortedChronological.map((att, i) => {
                const prev = i > 0 ? comparisonStats.sortedChronological[i - 1] : null;
                const diff = prev ? att.percentage - prev.percentage : 0;

                return (
                  <div key={att._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>Attempt #{att.attemptNumber}</span>
                        {bestAttempt?._id === att._id && (
                          <span className="text-[10px] text-accent-warm font-bold">★ Best</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-text-tertiary">
                          {formatSeconds(att.timeTakenSeconds)}
                        </span>
                        <span className="font-bold text-text-primary">{att.percentage}%</span>
                        {i > 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              diff > 0
                                ? 'text-accent-success'
                                : diff === 0
                                ? 'text-text-tertiary'
                                : 'text-accent-danger'
                            }`}
                          >
                            {diff > 0 ? `(+${diff}%)` : diff === 0 ? '(0%)' : `(${diff}%)`}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => navigate(`/quiz/attempt/${att._id}`)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-bg-primary overflow-hidden border border-border-default/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          att.passed
                            ? 'bg-gradient-to-r from-accent-primary to-accent-success'
                            : 'bg-gradient-to-r from-accent-warm to-accent-danger'
                        }`}
                        style={{ width: `${Math.max(5, att.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
