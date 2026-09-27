import { Flame, Award, Calendar, Check } from 'lucide-react';
import Card from '../ui/Card';

/**
 * Streak Tracker component displaying current study streak,
 * 7-day week activity tracker, and motivational achievements.
 */
export default function StreakTracker({
  streak = 0,
  isStreakActiveToday = false,
  lastStudyDate = null,
}) {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  // Build a rolling 7-day window ending on today (left = 6 days ago, right = today)
  // so streak days are always correctly positioned regardless of week boundaries.
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i; // leftmost pill = 6 days ago, rightmost = today
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);

    const dayIndex = date.getDay();
    const isToday = daysAgo === 0;

    // A day is active if it falls within the current streak window
    // daysAgo === 0 (today) is active only if isStreakActiveToday
    // daysAgo > 0 is active if within streak range (accounting for whether today counts)
    const isActive = isStreakActiveToday
      ? daysAgo < streak
      : daysAgo > 0 && daysAgo <= streak;

    return {
      day: dayLabels[dayIndex],
      isToday,
      isActive,
    };
  });

  return (
    <Card className="relative overflow-hidden" padding="lg">
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-accent-warm/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative p-3 rounded-2xl bg-accent-warm/15 border border-accent-warm/30 text-accent-warm shadow-inner animate-pulse-slow">
            <Flame className="w-7 h-7 fill-accent-warm text-accent-warm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-text-primary tracking-tight">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isStreakActiveToday
                    ? 'bg-accent-success/15 text-accent-success border border-accent-success/30'
                    : 'bg-accent-warm/15 text-accent-warm border border-accent-warm/30'
                }`}
              >
                {isStreakActiveToday ? 'Active Today' : 'Pending Study'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {isStreakActiveToday
                ? 'Great job! You continued your streak today.'
                : 'Study for at least 5 minutes today to maintain your streak.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-tertiary/50 border border-border-default text-xs text-text-secondary">
          <Calendar className="w-3.5 h-3.5 text-accent-primary" />
          <span>
            {lastStudyDate
              ? `Last active: ${new Date(lastStudyDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}`
              : 'Start your streak today!'}
          </span>
        </div>
      </div>

      {/* Week Day Indicator Pills */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(({ day, isToday, isActive }) => (
          <div
            key={day}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
              isActive
                ? 'bg-accent-warm/15 border-accent-warm/40 text-accent-warm'
                : isToday
                ? 'bg-bg-tertiary/80 border-accent-primary/50 text-text-primary'
                : 'bg-bg-tertiary/20 border-border-subtle text-text-tertiary'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase">{day}</span>
            <div
              className={`w-6 h-6 mt-1.5 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive
                  ? 'bg-accent-warm text-slate-950 shadow-sm'
                  : isToday
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'bg-bg-tertiary text-text-tertiary'
              }`}
            >
              {isActive ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : isToday ? (
                '•'
              ) : (
                '–'
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Milestone */}
      <div className="mt-4 pt-4 border-t border-border-default/60 flex items-center gap-2 text-xs text-text-secondary">
        <Award className="w-4 h-4 text-accent-primary shrink-0" />
        <span>
          {streak >= 30
            ? '🏆 Unstoppable! You unlocked the Monthly Master badge.'
            : streak >= 7
            ? `🔥 On fire! Keep going to reach the 30-day streak milestone.`
            : `🎯 Goal: Reach a 7-day streak to earn your first consistency badge!`}
        </span>
      </div>
    </Card>
  );
}
