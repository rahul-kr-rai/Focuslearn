import { useState } from 'react';
import { Target, CheckCircle2, Edit2, Check, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * GoalSetter component for setting and viewing weekly study hours target.
 */
export default function GoalSetter({
  currentStudyMinutes = 0,
  goalHours = 5,
  onSaveGoal,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputHours, setInputHours] = useState(goalHours || 5);
  const [saving, setSaving] = useState(false);

  const currentHours = (currentStudyMinutes / 60).toFixed(1);
  const targetHours = goalHours || 5;
  const progressPercent = Math.min(100, Math.round((currentHours / targetHours) * 100));
  const isGoalReached = currentHours >= targetHours;

  const handleSave = async () => {
    try {
      setSaving(true);
      if (onSaveGoal) {
        await onSaveGoal(Number(inputHours));
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-accent-secondary/15 text-accent-secondary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Weekly Study Goal</h3>
            <p className="text-xs text-text-secondary">Track your weekly learning commitment</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={() => {
              setInputHours(targetHours);
              setIsEditing(true);
            }}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            title="Edit weekly goal"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg text-accent-success hover:bg-accent-success/10 transition-colors"
              title="Save goal"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-text-tertiary hover:bg-bg-tertiary transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 my-2">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Target Hours Per Week: <strong className="text-accent-primary">{inputHours} hrs</strong>
            </label>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={inputHours}
              onChange={(e) => setInputHours(e.target.value)}
              className="w-full accent-accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-text-tertiary mt-1">
              <span>1 hr (Casual)</span>
              <span>10 hrs (Dedicated)</span>
              <span>40 hrs (Full-time)</span>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} loading={saving} className="w-full">
            Save Weekly Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-text-primary font-mono">
                {currentHours}
              </span>
              <span className="text-xs text-text-tertiary font-medium">
                / {targetHours} hrs this week
              </span>
            </div>
            <span
              className={`text-xs font-bold font-mono ${
                isGoalReached ? 'text-accent-success' : 'text-accent-secondary'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isGoalReached
                  ? 'bg-gradient-to-r from-emerald-500 to-accent-success'
                  : 'bg-gradient-to-r from-accent-primary to-accent-secondary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-text-secondary flex items-center gap-1.5">
            {isGoalReached ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-success shrink-0" />
                <span className="text-accent-success font-medium">
                  Goal accomplished for this week! Keep the momentum going.
                </span>
              </>
            ) : (
              <span>
                {Math.max(0, (targetHours - currentHours).toFixed(1))} hours left to hit your weekly goal.
              </span>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
