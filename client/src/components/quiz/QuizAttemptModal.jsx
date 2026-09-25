import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Award,
  BookOpen,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

function formatSeconds(sec = 0) {
  if (!sec || sec <= 0) return '< 1m';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function QuizAttemptModal({
  isOpen,
  onClose,
  attempt,
  videoTitle,
  courseTitle,
  onRetake,
}) {
  if (!attempt) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Attempt #${attemptNumber} Detailed Review`}
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Course / Video Breadcrumb if provided */}
        {(courseTitle || videoTitle) && (
          <div className="text-xs text-text-tertiary">
            {courseTitle && <span className="font-semibold text-text-secondary">{courseTitle}</span>}
            {courseTitle && videoTitle && <span> &gt; </span>}
            {videoTitle && <span>{videoTitle}</span>}
          </div>
        )}

        {/* Top Summary Banner */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-md transition-all ${
            passed
              ? 'border-accent-success/40 bg-gradient-to-r from-accent-success/15 via-bg-primary/80 to-bg-secondary'
              : 'border-accent-warm/40 bg-gradient-to-r from-accent-warm/15 via-bg-primary/80 to-bg-secondary'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  passed
                    ? 'bg-accent-success/20 text-accent-success'
                    : 'bg-accent-warm/20 text-accent-warm'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Attempt #{attemptNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      passed
                        ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
                        : 'bg-accent-warm/20 text-accent-warm border border-accent-warm/30'
                    }`}
                  >
                    {passed ? 'Passed (≥60%)' : 'Needs Practice'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text-primary mt-0.5 font-mono">
                  {score} / {total}{' '}
                  <span
                    className={`text-lg font-bold ml-1 ${
                      passed ? 'text-accent-success' : 'text-accent-warm'
                    }`}
                  >
                    ({percentage}%)
                  </span>
                </h3>
              </div>
            </div>

            {/* Timing and Date pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-primary/60 border border-border-default">
                <Clock className="w-3.5 h-3.5 text-accent-secondary" />
                <span>Time Taken: <strong className="text-text-primary font-mono">{formatSeconds(timeTakenSeconds)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-primary/60 border border-border-default">
                <Calendar className="w-3.5 h-3.5 text-accent-primary" />
                <span>
                  {completedAt
                    ? new Date(completedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border-default/60 text-center">
            <div className="p-2 rounded-lg bg-bg-primary/40">
              <p className="text-[10px] uppercase font-bold text-text-tertiary">Total Questions</p>
              <p className="text-sm font-bold text-text-primary font-mono">{total}</p>
            </div>
            <div className="p-2 rounded-lg bg-accent-success/10 border border-accent-success/20">
              <p className="text-[10px] uppercase font-bold text-accent-success">Correct</p>
              <p className="text-sm font-bold text-accent-success font-mono">{correctCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-accent-danger/10 border border-accent-danger/20">
              <p className="text-[10px] uppercase font-bold text-accent-danger">Incorrect</p>
              <p className="text-sm font-bold text-accent-danger font-mono">{incorrectCount}</p>
            </div>
          </div>
        </div>

        {/* Questions Detailed Breakdown */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-primary" />
            Questions & Answers Evaluation
          </h4>

          {answers.map((item, idx) => {
            const isCorrect = item.isCorrect;

            return (
              <div
                key={item.questionId || idx}
                className={`rounded-xl border p-4 sm:p-5 transition-all ${
                  isCorrect
                    ? 'border-accent-success/30 bg-bg-secondary/40'
                    : 'border-accent-danger/30 bg-bg-secondary/40'
                }`}
              >
                {/* Question statement */}
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrect
                        ? 'bg-accent-success/20 text-accent-success'
                        : 'bg-accent-danger/20 text-accent-danger'
                    }`}
                  >
                    {isCorrect ? (
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
                  {item.options?.map((opt, optIdx) => {
                    const isUserSelection = item.selectedOption === optIdx;
                    const isCorrectAnswer = item.correctAnswer === optIdx;

                    let style = 'border-border-default/50 bg-bg-primary/40 text-text-secondary';
                    let badge = null;

                    if (isCorrectAnswer) {
                      style =
                        'border-accent-success/60 bg-accent-success/15 text-accent-success font-medium';
                      badge = isUserSelection ? '✓ Correct (Your Choice)' : '✓ Correct Answer';
                    } else if (isUserSelection && !isCorrectAnswer) {
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

                {/* Explanation */}
                {item.explanation && (
                  <div className="ml-9 p-3 rounded-lg bg-bg-tertiary/40 border border-border-default/50 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary mr-1">Explanation:</span>
                    {item.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-default">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          {onRetake && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onRetake();
              }}
            >
              Retake Quiz
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
