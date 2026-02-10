import React from 'react';
import { DIFFICULTY_LEVELS, DEFAULT_BAR_WEIGHT } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import useIntervalTimer from '../../hooks/useIntervalTimer';
import useWakeLock from '../../hooks/useWakeLock';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

const IntervalTracker = ({ exercise, movementName, onUpdateExercise, onRemoveExercise, defaultUnit }) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false);

  const timer = useIntervalTimer({
    workDuration: exercise.workDuration,
    restDuration: exercise.restDuration,
    rounds: exercise.rounds
  });

  // Keep screen on while timer is running (including countdown)
  const isTimerActive = timer.state === 'countdown' || timer.state === 'work' || timer.state === 'rest';
  useWakeLock(isTimerActive);

  // Sync completed blocks to the exercise data whenever blocks change
  React.useEffect(() => {
    if (timer.state === 'complete') {
      // Build the blocks array: all completed blocks + the current (just-finished) block
      const blocks = [
        ...timer.completedBlocks.map(b => ({ difficulty: b.difficulty, totalTime: b.totalTime })),
        { difficulty: exercise.currentBlockDifficulty || 0, totalTime: timer.totalElapsed }
      ];
      onUpdateExercise({ isComplete: true, blocks });
    }
  }, [timer.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle difficulty selection for the current (active) block
  const handleCurrentBlockDifficulty = (difficulty) => {
    const blocks = [
      ...timer.completedBlocks.map(b => ({ difficulty: b.difficulty, totalTime: b.totalTime })),
      { difficulty, totalTime: timer.totalElapsed }
    ];
    onUpdateExercise({ currentBlockDifficulty: difficulty, blocks });
  };

  // Handle difficulty selection for a previously completed block
  const handlePastBlockDifficulty = (blockIndex, difficulty) => {
    timer.setBlockDifficulty(blockIndex, difficulty);
    // Rebuild blocks array with updated difficulty
    const blocks = [
      ...timer.completedBlocks.map(b => ({ difficulty: b.difficulty, totalTime: b.totalTime }))
    ];
    // If we're in complete state, include the current block too
    if (timer.state === 'complete') {
      blocks.push({ difficulty: exercise.currentBlockDifficulty || 0, totalTime: timer.totalElapsed });
    }
    onUpdateExercise({ blocks });
  };

  const handleGoAgain = () => {
    // Capture the current block's difficulty before goAgain resets everything
    const currentDifficulty = exercise.currentBlockDifficulty || 0;
    // goAgain() pushes { totalTime, difficulty: 0 } into completedBlocks and restarts
    timer.goAgain();
    // Now set the difficulty on the block that was just pushed (the last one)
    const lastIndex = timer.completedBlocks.length - 1;
    if (lastIndex >= 0) {
      timer.setBlockDifficulty(lastIndex, currentDifficulty);
    }
    // Reset the current block difficulty for the new block
    onUpdateExercise({ currentBlockDifficulty: 0, isComplete: false });
  };

  const isWork = timer.state === 'work';
  const isRest = timer.state === 'rest';
  const isIdle = timer.state === 'idle';
  const isCountdown = timer.state === 'countdown';
  const isPaused = timer.state === 'paused';
  const isComplete = timer.state === 'complete';

  const hasCompletedBlocks = timer.completedBlocks.length > 0;
  const currentBlockNumber = timer.completedBlocks.length + 1;

  // Background color based on current phase
  const phaseColor = isWork
    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
    : isRest
      ? 'bg-gray-50 dark:bg-navy-900 border-gray-200 dark:border-gray-700'
      : isCountdown
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-gray-700';

  const phaseLabel = isCountdown
    ? 'GET READY'
    : isWork
      ? 'WORK'
      : isRest
        ? 'REST'
        : isPaused
          ? 'PAUSED'
          : isComplete
            ? 'COMPLETE'
            : 'READY';

  const phaseLabelColor = isCountdown
    ? 'text-amber-600 dark:text-amber-400'
    : isWork
      ? 'text-emerald-600 dark:text-emerald-400'
      : isRest
        ? 'text-gray-500 dark:text-gray-400'
        : isPaused
          ? 'text-amber-600 dark:text-amber-400'
          : isComplete
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-400 dark:text-gray-500';

  return (
    <Card className={`p-4 border-2 transition-colors ${phaseColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icons.Interval />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{movementName}</h4>
        </div>
        <button
          onClick={() => setShowRemoveConfirm(true)}
          className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
          title="Remove exercise"
        >
          <Icons.Trash />
        </button>
      </div>

      {/* Config summary */}
      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span>{exercise.rounds} rounds</span>
        <span>{formatTime(exercise.workDuration)} work</span>
        <span>{formatTime(exercise.restDuration)} rest</span>
      </div>

      {/* Weighted movement toggle + weight entry */}
      <div className="mb-4 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={exercise.weighted || false}
            onChange={(e) => onUpdateExercise({ weighted: e.target.checked })}
            className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Weighted movement</span>
        </label>

        {exercise.weighted && (
          <div className="ml-6 space-y-2 bg-gray-50 dark:bg-navy-900 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={exercise.weight || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateExercise({ weight: val === '' ? null : parseFloat(val) });
                }}
                className="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-navy-800 dark:text-gray-100"
                placeholder="Weight"
                min="0"
                step="2.5"
              />
              <button
                onClick={() => {
                  const currentUnit = exercise.unit || defaultUnit || 'lbs';
                  onUpdateExercise({ unit: currentUnit === 'lbs' ? 'kg' : 'lbs' });
                }}
                className="px-2 py-1.5 text-xs rounded bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
              >
                {exercise.unit || defaultUnit || 'lbs'}
              </button>
              <label className="flex items-center gap-1 cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={exercise.perDumbbell || false}
                  onChange={(e) => onUpdateExercise({ perDumbbell: e.target.checked })}
                  className="w-3.5 h-3.5 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">per DB</span>
              </label>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exercise.isOneSide || false}
                onChange={(e) => onUpdateExercise({ isOneSide: e.target.checked })}
                className="w-3.5 h-3.5 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">One-side entry</span>
            </label>

            {exercise.isOneSide && (
              <>
                <label className="flex items-center gap-2 cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={exercise.ignoreBarWeight || false}
                    onChange={(e) => onUpdateExercise({ ignoreBarWeight: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Ignore bar weight</span>
                </label>
                {!exercise.ignoreBarWeight && (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Bar:</span>
                    <input
                      type="number"
                      value={exercise.barWeight || ''}
                      onChange={(e) => onUpdateExercise({ barWeight: e.target.value === '' ? null : parseFloat(e.target.value) })}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-navy-800 dark:text-gray-100"
                      placeholder={DEFAULT_BAR_WEIGHT[exercise.unit || defaultUnit || 'lbs']}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{exercise.unit || defaultUnit || 'lbs'}</span>
                  </div>
                )}
                {exercise.weight && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-4">
                    Total: {(() => {
                      const sideWeight = exercise.weight || 0;
                      if (exercise.ignoreBarWeight) return sideWeight * 2;
                      const bar = exercise.barWeight || DEFAULT_BAR_WEIGHT[exercise.unit || defaultUnit || 'lbs'];
                      return (sideWeight * 2) + bar;
                    })()} {exercise.unit || defaultUnit || 'lbs'}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Completed blocks — shown faded to the left */}
      {hasCompletedBlocks && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {timer.completedBlocks.map((block, i) => {
            const diffLevel = block.difficulty > 0 ? DIFFICULTY_LEVELS[block.difficulty] : null;
            return (
              <div
                key={i}
                className="flex-shrink-0 bg-gray-100 dark:bg-navy-900 rounded-lg px-3 py-2 opacity-60 min-w-[80px]"
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Block {i + 1}</div>
                <div className="text-sm font-mono text-gray-600 dark:text-gray-400">{formatTime(block.totalTime)}</div>
                <div className="flex justify-center gap-1 mt-1">
                  {DIFFICULTY_LEVELS.slice(1).map(level => (
                    <button
                      key={level.value}
                      onClick={() => handlePastBlockDifficulty(i, level.value)}
                      className={`w-5 h-5 rounded-full text-[8px] font-bold transition-all ${
                        block.difficulty === level.value
                          ? 'ring-1 ring-offset-1 ring-emerald-400 scale-110 opacity-100'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: level.color, color: level.textColor }}
                      title={level.label}
                    >
                      {level.value}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Block label when multiple blocks exist */}
      {hasCompletedBlocks && !isIdle && (
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mb-1">
          Block {currentBlockNumber}
        </div>
      )}

      {/* Timer display */}
      <div className="text-center py-4">
        <div className={`text-sm font-semibold uppercase tracking-wider mb-1 ${phaseLabelColor}`}>
          {phaseLabel}
        </div>

        {isCountdown && (
          <div className="text-6xl font-mono font-bold text-amber-600 mb-2">
            {timer.timeRemaining}
          </div>
        )}

        {(isWork || isRest || isPaused) && (
          <>
            <div className="text-5xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-2">
              {formatTime(timer.timeRemaining)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Round {timer.currentRound} of {exercise.rounds}
            </div>
            {/* Round progress dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {Array.from({ length: exercise.rounds }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < timer.currentRound - 1
                      ? 'bg-emerald-500'
                      : i === timer.currentRound - 1
                        ? (isWork ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400 animate-pulse')
                        : 'bg-gray-200 dark:bg-gray-700'
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
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <Icons.CheckCircle />
              <span className="text-lg font-semibold">All rounds complete!</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
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
        {(isCountdown || isWork || isRest) && (
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
          <Button variant="secondary" onClick={handleGoAgain} size="sm">
            <Icons.Play /> Go Again?
          </Button>
        )}
      </div>

      {/* Difficulty rating for current block — shown after completion */}
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
            How difficult was {hasCompletedBlocks ? `block ${currentBlockNumber}` : 'this'}?
          </p>
          <div className="flex justify-center gap-2">
            {DIFFICULTY_LEVELS.slice(1).map(level => (
              <button
                key={level.value}
                onClick={() => handleCurrentBlockDifficulty(level.value)}
                className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                  (exercise.currentBlockDifficulty || 0) === level.value
                    ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
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
          {(exercise.currentBlockDifficulty || 0) > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              {DIFFICULTY_LEVELS[exercise.currentBlockDifficulty]?.label}
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
