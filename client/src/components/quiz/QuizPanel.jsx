import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Award,
  BookOpen,
  Clock,
  History,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Zap,
  Play,
  Calendar,
  Eye,
  BarChart2,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import Card from '../ui/Card';
import { quizAPI } from '../../services/api';

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

export default function QuizPanel({
  videoId,
  videoTitle = 'Lesson',
  courseId: _courseId,
  onQuizCompleted,
}) {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [latestAttempt, setLatestAttempt] = useState(null);
  const [bestAttempt, setBestAttempt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Active view tab: 'take' | 'review' | 'history' | 'compare'
  const [viewMode, setViewMode] = useState('take');

  // Quiz taking state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Fetch quiz & attempts on videoId change
  useEffect(() => {
    let isMounted = true;

    const fetchQuizAndAttempts = async () => {
      if (!videoId) return;

      try {
        setLoading(true);
        setError(null);
        setSelectedAnswers({});
        setCurrentQuestionIdx(0);
        setTimerSeconds(0);
        setIsTimerRunning(false);

        const res = await quizAPI.getByVideo(videoId);
        if (!isMounted) return;

        const data = res.data?.data || {};
        const fetchedQuiz = data.quiz;
        const fetchedAttempts = data.attempts || [];
        const fetchedLatest = data.latestAttempt || null;
        const fetchedBest = data.bestAttempt || null;

        setQuiz(fetchedQuiz);
        setAttempts(fetchedAttempts);
        setLatestAttempt(fetchedLatest);
        setBestAttempt(fetchedBest);

        // If the user already has attempts, start on 'review' mode showing their latest performance
        if (fetchedAttempts.length > 0) {
          setViewMode('review');
        } else {
          setViewMode('take');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Failed to check for quiz.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuizAndAttempts();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [videoId]);

  // Live Timer for Quiz Taking
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

  // Start / Retake Quiz flow
  const handleStartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setViewMode('take');
  };

  // Generate quiz using Gemini AI
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
      handleStartQuiz();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to generate AI quiz. Please verify server connection and try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Select option in taking mode
  const handleSelectOption = (optionIdx) => {
    if (viewMode !== 'take') return;
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIdx,
    }));
  };

  // Submit completed answers
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

      // Update attempts and latest attempt
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

      // Re-calculate best attempt
      const newBest = [...updatedAttempts].sort(
        (a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds
      )[0];
      setBestAttempt(newBest);

      setViewMode('review');
      onQuizCompleted?.(resultData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.');
      setIsTimerRunning(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────
  // Comparison Metrics Computation
  // ──────────────────────────────────────────────
  const comparisonStats = useMemo(() => {
    if (attempts.length === 0) return null;

    const totalAttempts = attempts.length;
    const sortedChronological = [...attempts].sort(
      (a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt)
    );

    const first = sortedChronological[0];
    const latest = sortedChronological[sortedChronological.length - 1];
    const overallDelta = latest.percentage - first.percentage;

    const avgScore =
      attempts.reduce((sum, a) => sum + a.score, 0) / (totalAttempts * (attempts[0]?.total || 5));
    const avgPercentage = Math.round(avgScore * 100);

    const totalTime = attempts.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0);
    const avgTime = Math.round(totalTime / totalAttempts);

    return {
      totalAttempts,
      first,
      latest,
      overallDelta,
      avgPercentage,
      avgTime,
      sortedChronological,
    };
  }, [attempts]);

  // ──────────────────────────────────────────────
  // Loading State
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader size="md" text="Checking quiz records & attempts..." />
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Generating State
  // ──────────────────────────────────────────────
  if (generating) {
    return (
      <div className="py-12 px-6 rounded-2xl border border-accent-primary/30 bg-gradient-to-b from-accent-primary/10 via-bg-secondary/60 to-bg-secondary/90 text-center animate-pulse">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center text-white shadow-lg shadow-accent-primary/25 animate-bounce">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">
          Generating AI Quiz with Gemini...
        </h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto mb-4">
          Analyzing &ldquo;{videoTitle}&rdquo;, synthesizing key concepts, and crafting 5 conceptual questions with verified answers and explanations.
        </p>
        <div className="flex justify-center items-center gap-1.5 text-xs text-accent-secondary font-medium">
          <Zap className="w-3.5 h-3.5 animate-spin" />
          <span>Formulating questions & verified answers</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // State: No Quiz Generated Yet
  // ──────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border-default/80 bg-gradient-to-br from-bg-secondary/90 via-bg-secondary/60 to-bg-tertiary/30 p-6 md:p-8 text-center shadow-xl">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-accent-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-12 h-12 rounded-xl bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-primary mx-auto mb-4 shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-text-primary mb-1.5">
          Reinforce Your Learning with AI
        </h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
          Google Gemini will instantly generate a tailored 5-question multiple-choice quiz based on this lesson to test your retention and grasp of key concepts.
        </p>

        {error && (
          <div className="flex items-center justify-center gap-2 text-xs text-accent-danger mb-4 p-2 rounded-lg bg-accent-danger/10 border border-accent-danger/20 max-w-md mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          icon={Sparkles}
          onClick={() => handleGenerateQuiz(false)}
          className="shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 hover:scale-[1.02] transition-all"
        >
          Generate AI Quiz
        </Button>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-4">
      {/* ── Top Navigation & Mode Switcher Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-bg-secondary border border-border-default shadow-md">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={handleStartQuiz}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'take'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            {attempts.length > 0 ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Take Quiz
              </>
            )}
          </button>

          {latestAttempt && (
            <button
              onClick={() => setViewMode('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'review'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Latest Result
            </button>
          )}

          {attempts.length > 0 && (
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'history'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Attempts ({attempts.length})
            </button>
          )}

          {attempts.length >= 2 && (
            <button
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'compare'
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Compare ({attempts.length})
            </button>
          )}
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {bestAttempt && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-warm/10 border border-accent-warm/25 text-accent-warm text-[11px] font-semibold">
              <Trophy className="w-3 h-3" />
              <span>
                Best: {bestAttempt.score}/{bestAttempt.total} ({bestAttempt.percentage}%)
              </span>
            </div>
          )}
          {viewMode === 'take' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-primary border border-border-default font-mono text-xs text-text-primary">
              <Clock className="w-3.5 h-3.5 text-accent-secondary" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 1: ACTIVE QUIZ TAKING                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'take' && (
        <div className="rounded-2xl border border-border-default bg-bg-secondary/50 backdrop-blur-md p-5 sm:p-7 transition-all shadow-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-border-default">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {attempts.length > 0 ? `Retake (Attempt #${attempts.length + 1})` : 'First Attempt'}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-text-primary mt-0.5">
                Question {currentQuestionIdx + 1} of {totalQ}
              </h4>
            </div>

            {/* Stepper chips */}
            <div className="flex items-center gap-1.5">
              {questions.map((_, i) => {
                const isAnswered = selectedAnswers[i] !== undefined;
                const isCurrent = currentQuestionIdx === i;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all ${
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

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-bg-tertiary overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
              style={{ width: `${((currentQuestionIdx + 1) / totalQ) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          {currentQ && (
            <div className="mb-6">
              <p className="text-base sm:text-lg font-semibold text-text-primary leading-relaxed">
                {currentQ.question}
              </p>
            </div>
          )}

          {/* MCQ Options */}
          {currentQ && (
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center gap-3.5 group ${
                      isSelected
                        ? 'border-accent-primary bg-accent-primary/15 text-text-primary shadow-md ring-1 ring-accent-primary'
                        : 'border-border-default/70 bg-bg-primary/40 text-text-secondary hover:border-border-default hover:bg-bg-primary/80 hover:text-text-primary'
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
            <div className="p-3 mb-4 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-xs text-accent-danger">
              {error}
            </div>
          )}

          {/* Bottom navigation */}
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
      {/* MODE 2: REVIEW LATEST ATTEMPT                               */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'review' && latestAttempt && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Summary Card */}
          <div
            className={`rounded-2xl border p-6 md:p-8 text-center backdrop-blur-md transition-all ${
              latestAttempt.passed
                ? 'border-accent-success/40 bg-gradient-to-b from-accent-success/15 via-bg-secondary/70 to-bg-secondary/90'
                : 'border-accent-warm/40 bg-gradient-to-b from-accent-warm/15 via-bg-secondary/70 to-bg-secondary/90'
            }`}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-bg-primary/80 border border-border-default shadow-md">
              <Award
                className={`w-8 h-8 ${
                  latestAttempt.passed ? 'text-accent-success' : 'text-accent-warm'
                }`}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-primary/70 border border-border-default text-xs font-semibold text-text-tertiary mb-2">
              <span>Attempt #{latestAttempt.attemptNumber}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-accent-secondary" />
                {formatSeconds(latestAttempt.timeTakenSeconds)}
              </span>
            </div>

            <h3 className="text-2xl font-extrabold text-text-primary mb-1">
              {latestAttempt.passed ? 'Quiz Passed! 🎉' : 'Keep Practicing! 💪'}
            </h3>
            <p className="text-xs text-text-secondary mb-4 max-w-md mx-auto">
              {latestAttempt.passed
                ? 'Great job! You demonstrated mastery of this lesson material.'
                : 'Review the explanations below and give it another try to reinforce your understanding.'}
            </p>

            {/* Score & Percentage */}
            <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-xl bg-bg-primary/60 border border-border-default mb-4">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-text-tertiary">Score</span>
                <p className="text-lg font-bold text-text-primary font-mono">
                  {latestAttempt.score} / {latestAttempt.total}
                </p>
              </div>
              <div className="w-px h-8 bg-border-default" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-text-tertiary">Percentage</span>
                <p
                  className={`text-lg font-bold font-mono ${
                    latestAttempt.passed ? 'text-accent-success' : 'text-accent-warm'
                  }`}
                >
                  {latestAttempt.percentage}%
                </p>
              </div>
            </div>

            {/* Improvement callout */}
            {latestAttempt.improvementDelta !== undefined && latestAttempt.attemptNumber > 1 && (
              <div className="mb-6">
                {latestAttempt.improvementDelta > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-success bg-accent-success/10 px-3 py-1 rounded-full border border-accent-success/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{latestAttempt.improvementDelta}% score increase vs previous attempt!
                  </span>
                ) : latestAttempt.improvementDelta === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary bg-bg-primary/60 px-3 py-1 rounded-full">
                    Matched previous attempt score
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-accent-warm bg-accent-warm/10 px-3 py-1 rounded-full border border-accent-warm/20">
                    {latestAttempt.improvementDelta}% compared to previous attempt
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleStartQuiz}>
                Retake Quiz
              </Button>
              {latestAttempt?._id && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => navigate(`/quiz/attempt/${latestAttempt._id}`)}
                >
                  Full-Page Review
                </Button>
              )}
              {_courseId && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={BookOpen}
                  onClick={() =>
                    navigate(`/course/${_courseId}/quiz/${videoId}?retake=true`)
                  }
                >
                  Dedicated Quiz Page
                </Button>
              )}
              {attempts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={TrendingUp}
                  onClick={() => setViewMode('compare')}
                >
                  Compare
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={History}
                onClick={() => setViewMode('history')}
              >
                Attempts ({attempts.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={() => handleGenerateQuiz(true)}
              >
                Regenerate Questions
              </Button>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-primary" />
              Latest Attempt Questions & Explanations
            </h4>

            {latestAttempt.answers?.map((item, idx) => (
              <div
                key={item.questionId || idx}
                className={`rounded-xl border p-5 transition-all ${
                  item.isCorrect
                    ? 'border-accent-success/30 bg-bg-secondary/40'
                    : 'border-accent-danger/30 bg-bg-secondary/40'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.isCorrect
                        ? 'bg-accent-success/20 text-accent-success'
                        : 'bg-accent-danger/20 text-accent-danger'
                    }`}
                  >
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </span>
                  <p className="text-sm font-semibold text-text-primary pt-0.5">
                    <span className="text-text-tertiary mr-1.5">Q{idx + 1}.</span>
                    {item.question}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 pl-9">
                  {item.options?.map((opt, optIdx) => {
                    const isUserSelection = item.selectedOption === optIdx;
                    const isCorrect = item.correctAnswer === optIdx;

                    let style = 'border-border-default/50 bg-bg-primary/40 text-text-secondary';
                    let badge = null;

                    if (isCorrect) {
                      style =
                        'border-accent-success/60 bg-accent-success/15 text-accent-success font-medium';
                      badge = isUserSelection ? '✓ Correct Choice' : '✓ Correct Answer';
                    } else if (isUserSelection && !isCorrect) {
                      style =
                        'border-accent-danger/60 bg-accent-danger/15 text-accent-danger font-medium';
                      badge = '✗ Your Choice';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${style}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] opacity-70">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                        {badge && (
                          <span className="text-[10px] uppercase font-bold shrink-0">
                            {badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {item.explanation && (
                  <div className="ml-9 p-3 rounded-lg bg-bg-tertiary/40 border border-border-default/50 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary mr-1">Explanation:</span>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 3: SEPARATE ATTEMPT RECORDS & HISTORY                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <div>
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <History className="w-4 h-4 text-accent-primary" />
                All Quiz Attempt Records
              </h4>
              <p className="text-xs text-text-secondary">
                Review your performance and question responses across all attempts.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleStartQuiz}>
              Retake Quiz
            </Button>
          </div>

          <div className="space-y-3">
            {attempts.map((att) => {
              const isBest = bestAttempt?._id === att._id;
              const isLatest = latestAttempt?._id === att._id;

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
                        {isLatest && !isBest && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                            Latest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(att.completedAt || att.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
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
                      onClick={() => setInspectAttempt(att)}
                    >
                      Review
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODE 4: COMPARE ATTEMPTS & PROGRESSION                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === 'compare' && comparisonStats && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <div>
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent-primary" />
                Performance Comparison Across Attempts
              </h4>
              <p className="text-xs text-text-secondary">
                Track your score progression and speed efficiency over time.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleStartQuiz}>
              Retake Quiz
            </Button>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card padding="sm" className="space-y-1">
              <span className="text-[11px] text-text-tertiary font-semibold uppercase">
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
              <span className="text-[11px] text-accent-warm font-semibold uppercase">
                Best Attempt
              </span>
              <p className="text-xl font-bold font-mono text-accent-warm">
                {bestAttempt?.percentage}%
              </p>
              <p className="text-[11px] text-text-tertiary">
                Attempt #{bestAttempt?.attemptNumber} ({formatSeconds(bestAttempt?.timeTakenSeconds)})
              </p>
            </Card>

            <Card padding="sm" className="space-y-1">
              <span className="text-[11px] text-text-tertiary font-semibold uppercase">
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
              <span className="text-[11px] text-accent-success font-semibold uppercase">
                Overall Progress
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
              <p className="text-[11px] text-text-tertiary">First vs Latest</p>
            </Card>
          </div>

          {/* Visual Progress Bar Chart */}
          <Card padding="md" className="space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Score & Mastery Progression
            </h5>

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

          {/* Comparison Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-primary/80 border-b border-border-default text-text-tertiary uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Attempt</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Percentage</th>
                    <th className="p-3">Time Taken</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50">
                  {attempts.map((att) => (
                    <tr
                      key={att._id}
                      className="hover:bg-bg-primary/40 transition-colors duration-150"
                    >
                      <td className="p-3 font-bold text-text-primary">
                        Attempt #{att.attemptNumber}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {new Date(att.completedAt || att.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3 font-mono font-bold text-text-primary">
                        {att.score} / {att.total}
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-bold ${
                            att.passed ? 'text-accent-success' : 'text-accent-warm'
                          }`}
                        >
                          {att.percentage}%
                        </span>
                      </td>
                      <td className="p-3 font-mono text-text-secondary">
                        {formatSeconds(att.timeTakenSeconds)}
                      </td>
                      <td className="p-3">
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
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => navigate(`/quiz/attempt/${att._id}`)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
