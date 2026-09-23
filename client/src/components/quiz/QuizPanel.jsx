import { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Award,
  BookOpen,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import { quizAPI } from '../../services/api';

/**
 * QuizPanel component — AI-powered interactive quiz module with generation, taking, and detailed review.
 */
export default function QuizPanel({
  videoId,
  videoTitle = 'Lesson',
  onQuizCompleted,
}) {
  const [quiz, setQuiz] = useState(null);
  const [pastAttempt, setPastAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Quiz taking state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [quizResults, setQuizResults] = useState(null);

  // Fetch existing quiz and past attempts when video changes
  useEffect(() => {
    let isMounted = true;

    const fetchQuiz = async () => {
      if (!videoId) return;

      try {
        setLoading(true);
        setError(null);
        setQuizResults(null);
        setSelectedAnswers({});
        setCurrentQuestionIdx(0);

        const res = await quizAPI.getByVideo(videoId);
        if (!isMounted) return;

        setQuiz(res.data.data.quiz);
        setPastAttempt(res.data.data.pastAttempt);
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Failed to check for quiz.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuiz();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  // Generate quiz using Gemini AI
  const handleGenerateQuiz = async (forceRegenerate = false) => {
    try {
      setGenerating(true);
      setError(null);
      setQuizResults(null);
      setSelectedAnswers({});
      setCurrentQuestionIdx(0);

      const res = await quizAPI.generate(videoId, forceRegenerate);
      setQuiz(res.data.data.quiz);
      setPastAttempt(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to generate AI quiz. Please verify server connection and try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Select an option for current question
  const handleSelectOption = (optionIdx) => {
    if (quizResults) return; // Read-only in review mode
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

      const formattedAnswers = quiz.questions.map((_, idx) =>
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
      );

      const res = await quizAPI.submit(quiz._id, formattedAnswers);
      const resultData = res.data.data;
      setQuizResults(resultData);
      onQuizCompleted?.(resultData);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit quiz. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Retake quiz
  const handleRetake = () => {
    setSelectedAnswers({});
    setQuizResults(null);
    setCurrentQuestionIdx(0);
  };

  // ──────────────────────────────────────────────
  // Loading State
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader size="md" text="Checking for quizzes..." />
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Generating State (AI Thinking Animation)
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
          Analyzing "{videoTitle}", synthesizing key learning objectives, and crafting 5 conceptual questions with explanations.
        </p>
        <div className="flex justify-center items-center gap-1.5 text-xs text-accent-secondary font-medium">
          <Zap className="w-3.5 h-3.5 animate-spin" />
          <span>Formulating questions & verified answers</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // State 1: No Quiz Generated Yet
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

  // ──────────────────────────────────────────────
  // State 4: Results & Question Review
  // ──────────────────────────────────────────────
  if (quizResults) {
    const { score, total, percentage, passed, results } = quizResults;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Score Summary Card */}
        <div
          className={`rounded-2xl border p-6 md:p-8 text-center backdrop-blur-md transition-all ${
            passed
              ? 'border-accent-success/40 bg-gradient-to-b from-accent-success/15 via-bg-secondary/70 to-bg-secondary/90'
              : 'border-accent-warm/40 bg-gradient-to-b from-accent-warm/15 via-bg-secondary/70 to-bg-secondary/90'
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-bg-primary/80 border border-border-default shadow-md">
            <Award
              className={`w-8 h-8 ${
                passed ? 'text-accent-success' : 'text-accent-warm'
              }`}
            />
          </div>

          <h3 className="text-2xl font-extrabold text-text-primary mb-1">
            {passed ? 'Quiz Passed! 🎉' : 'Keep Practicing! 💪'}
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            {passed
              ? 'You have demonstrated solid comprehension of this lesson.'
              : 'Review the explanations below and give it another try to master the topic.'}
          </p>

          <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-xl bg-bg-primary/60 border border-border-default mb-6">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-text-tertiary">
                Score
              </span>
              <p className="text-lg font-bold text-text-primary font-mono">
                {score} / {total}
              </p>
            </div>
            <div className="w-px h-8 bg-border-default" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-text-tertiary">
                Percentage
              </span>
              <p
                className={`text-lg font-bold font-mono ${
                  passed ? 'text-accent-success' : 'text-accent-warm'
                }`}
              >
                {percentage}%
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={handleRetake}
            >
              Retake Quiz
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => handleGenerateQuiz(true)}
            >
              Generate New Questions
            </Button>
          </div>
        </div>

        {/* Question-by-Question Detailed Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-primary" />
            Answer Review & Explanations
          </h4>

          {results.map((item, idx) => (
            <div
              key={item.questionId || idx}
              className={`rounded-xl border p-5 transition-all ${
                item.isCorrect
                  ? 'border-accent-success/30 bg-bg-secondary/40'
                  : 'border-accent-danger/30 bg-bg-secondary/40'
              }`}
            >
              {/* Question Header */}
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

              {/* Options list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 pl-9">
                {item.options.map((opt, optIdx) => {
                  const isUserSelection = item.selectedOption === optIdx;
                  const isCorrect = item.correctAnswer === optIdx;

                  let style =
                    'border-border-default/50 bg-bg-primary/40 text-text-secondary';
                  let badge = null;

                  if (isCorrect) {
                    style =
                      'border-accent-success/60 bg-accent-success/15 text-accent-success font-medium';
                    badge = '✓ Correct';
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

              {/* Explanation Callout */}
              {item.explanation && (
                <div className="ml-9 p-3 rounded-lg bg-bg-tertiary/40 border border-border-default/50 text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary mr-1">
                    Explanation:
                  </span>
                  {item.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // State 3: Active Interactive Quiz Taking
  // ──────────────────────────────────────────────
  const questions = quiz.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === totalQ;

  return (
    <div className="rounded-2xl border border-border-default bg-bg-secondary/50 backdrop-blur-md p-5 sm:p-7 transition-all shadow-xl">
      {/* Quiz Progress & Stepper Header */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Lesson Quiz
            </span>
            {pastAttempt && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                Past Best: {pastAttempt.score}/{pastAttempt.total} ({pastAttempt.percentage}%)
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-text-primary mt-0.5">
            Question {currentQuestionIdx + 1} of {totalQ}
          </h4>
        </div>

        {/* Question jumper chips */}
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

      {/* Current Question Statement */}
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
                {/* Option Letter Indicator */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-tertiary text-text-secondary group-hover:text-text-primary'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>

                {/* Option Text */}
                <span className="text-sm flex-1 leading-normal font-medium">
                  {option}
                </span>

                {/* Radio Circle */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-accent-primary'
                      : 'border-border-default group-hover:border-text-tertiary'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-accent-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-xs text-accent-danger">
          {error}
        </div>
      )}

      {/* Bottom Nav Controls */}
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
  );
}
