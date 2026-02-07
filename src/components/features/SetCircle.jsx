import React, { useState, useEffect } from 'react';
import { DIFFICULTY_LEVELS } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import useLongPress from '../../hooks/useLongPress';

const SetCircle = ({
  setIndex,
  weight,
  reps,
  difficulty,
  restTime,
  isGo,
  prevSetRepStartTime,
  onWeightClick,
  onCircleClick,
  onCircleLongPress,
  onDifficultyClick,
  unit
}) => {
  const longPressHandlers = useLongPress(onCircleLongPress, 3000);
  const difficultyLevel = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS[0];
  const [liveTime, setLiveTime] = useState(null);

  const hasReps = reps !== null && reps !== undefined && reps > 0;
  const showGo = isGo && !hasReps;

  useEffect(() => {
    if (prevSetRepStartTime && !hasReps && (restTime === null || restTime === undefined)) {
      const updateTimer = () => {
        const elapsed = Math.round((Date.now() - prevSetRepStartTime) / 1000);
        setLiveTime(elapsed);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveTime(null);
    }
  }, [prevSetRepStartTime, restTime, hasReps]);

  const timerDisplay = restTime !== null && restTime !== undefined
    ? formatTime(restTime)
    : liveTime !== null
      ? formatTime(liveTime)
      : '';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`h-5 text-xs font-mono ${liveTime !== null ? 'text-orange-500 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
        {timerDisplay}
      </div>

      <button
        onClick={onWeightClick}
        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {weight} {unit}
      </button>

      <button
        onClick={onCircleClick}
        {...longPressHandlers}
        className={`w-14 h-14 rounded-full border-3 flex items-center justify-center text-lg font-bold transition-all select-none ${
          showGo
            ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300'
            : hasReps
              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-navy-900 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-400'
        }`}
        style={{ borderWidth: '3px' }}
      >
        {showGo ? 'GO' : hasReps ? reps : ''}
      </button>

      <span className="text-xs text-gray-500 dark:text-gray-400">Set {setIndex + 1}</span>

      <button
        onClick={onDifficultyClick}
        className="w-14 h-6 rounded text-xs font-medium transition-all"
        style={{
          backgroundColor: difficultyLevel.color,
          color: difficultyLevel.textColor
        }}
      >
        {difficulty === 0 ? '—' : difficultyLevel.label.split(' ')[0]}
      </button>
    </div>
  );
};

export default SetCircle;
