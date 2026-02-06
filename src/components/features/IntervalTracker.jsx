import React from 'react';
import { DIFFICULTY_LEVELS } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import useIntervalTimer from '../../hooks/useIntervalTimer';
import useWakeLock from '../../hooks/useWakeLock';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

const IntervalTracker = ({ exercise, movementName, onUpdateExercise, onRemoveExercise }) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false);

  const timer = useIntervalTimer({
    workDuration: exercise.workDuration,
    restDuration: exercise.restDuration,
    rounds: exercise.rounds
  });

  // Keep screen on while timer is running
  const isTimerActive = timer.state === 'work' || timer.state === 'rest';
  useWakeLock(isTimerActive);

  // Mark exercise complete when timer finishes
  React.useEffect(() => {
    if (timer.state === 'complete' && !exercise.isComplete) {
      onUpdateExercise({ isComplete: true });
    }
  }, [timer.state, exercise.isComplete, onUpdateExercise]);

  const handleDifficultySelect = (difficulty) => {
    onUpdateExercise({ difficulty });
  };

  const isWork = timer.state === 'work';
  const isRest = timer.state === 'rest';
  const isIdle = timer.state === 'idle';
  const isPaused = timer.state === 'paused';
  const isComplete = timer.state === 'complete';

  // Background color based on current phase
  const phaseColor = isWork
    ? 'bg-indigo-50 border-indigo-200'
    : isRest
      ? 'bg-gray-50 border-gray-200'
      : 'bg-white border-gray-200';

  const phaseLabel = isWork
    ? 'WORK'
    : isRest
      ? 'REST'
      : isPaused
        ? 'PAUSED'
        : isComplete
          ? 'COMPLETE'
          : 'READY';

  const phaseLabelColor = isWork
    ? 'text-indigo-600'
    : isRest
      ? 'text-gray-500'
      : isPaused
        ? 'text-amber-600'
        : isComplete
          ? 'text-green-600'
          : 'text-gray-400';

  return (
    <Card className={`p-4 border-2 transition-colors ${phaseColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icons.Interval />
          <h4 className="font-medium text-gray-900">{movementName}</h4>
        </div>
        <button
          onClick={() => setShowRemoveConfirm(true)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Remove exercise"
        >
          <Icons.Trash />
        </button>
      </div>

      {/* Config summary */}
      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <span>{exercise.rounds} rounds</span>
        <span>{formatTime(exercise.workDuration)} work</span>
        <span>{formatTime(exercise.restDuration)} rest</span>
      </div>

      {/* Timer display */}
      <div className="text-center py-4">
        <div className={`text-sm font-semibold uppercase tracking-wider mb-1 ${phaseLabelColor}`}>
          {phaseLabel}
        </div>

        {(isWork || isRest || isPaused) && (
          <>
            <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
              {formatTime(timer.timeRemaining)}
            </div>
            <div className="text-sm text-gray-500">
              Round {timer.currentRound} of {exercise.rounds}
            </div>
            {/* Round progress dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {Array.from({ length: exercise.rounds }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < timer.currentRound - 1
                      ? 'bg-indigo-500'                          // completed rounds
                      : i === timer.currentRound - 1
                        ? (isWork ? 'bg-indigo-400 animate-pulse' : 'bg-gray-400 animate-pulse')  // current round
                        : 'bg-gray-200'                          // upcoming rounds
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {isIdle && (
          <div className="text-4xl font-mono font-bold text-gray-300 mb-2">
            {formatTime(exercise.workDuration)}
          </div>
        )}

        {isComplete && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Icons.CheckCircle />
              <span className="text-lg font-semibold">All rounds complete!</span>
            </div>
            <div className="text-sm text-gray-500">
              Total time: {formatTime(timer.totalElapsed)}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-2">
        {isIdle && (
          <Button onClick={timer.start}>
            <Icons.Play /> Start Timer
          </Button>
        )}
        {(isWork || isRest) && (
          <Button variant="secondary" onClick={timer.pause}>
            <Icons.Pause /> Pause
          </Button>
        )}
        {isPaused && (
          <>
            <Button onClick={timer.resume}>
              <Icons.Play /> Resume
            </Button>
            <Button variant="ghost" onClick={timer.reset}>
              Reset
            </Button>
          </>
        )}
        {isComplete && (
          <Button variant="ghost" onClick={timer.reset} size="sm">
            Reset Timer
          </Button>
        )}
      </div>

      {/* Difficulty rating — shown after completion */}
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2 text-center">How difficult was this?</p>
          <div className="flex justify-center gap-2">
            {DIFFICULTY_LEVELS.slice(1).map(level => (
              <button
                key={level.value}
                onClick={() => handleDifficultySelect(level.value)}
                className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                  exercise.difficulty === level.value
                    ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: level.color,
                  color: level.textColor
                }}
                title={level.label}
              >
                {level.value}
              </button>
            ))}
          </div>
          {exercise.difficulty > 0 && (
            <p className="text-center text-sm text-gray-500 mt-1">
              {DIFFICULTY_LEVELS[exercise.difficulty]?.label}
            </p>
          )}
        </div>
      )}

      {/* Remove confirmation */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => {
          setShowRemoveConfirm(false);
          onRemoveExercise();
        }}
        title="Remove Exercise"
        message={`Remove ${movementName} from this workout?`}
        confirmLabel="Remove"
        variant="danger"
      />
    </Card>
  );
};

export default IntervalTracker;
