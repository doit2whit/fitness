import React from 'react';
import { formatTime } from '../../utils/helpers';
import { getWorkoutAvgDifficulty, getDifficultyInfo } from '../../utils/workoutUtils';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const WorkoutSummaryCard = ({ workout, movements, onClick }) => {
  const avgDifficulty = getWorkoutAvgDifficulty(workout);
  const difficultyInfo = getDifficultyInfo(avgDifficulty);
  const totalSets = workout.exercises.reduce((sum, ex) =>
    sum + (ex.sets ? ex.sets.filter(s => s.reps !== null && s.reps !== undefined).length : 0), 0
  );
  const intervalExercises = workout.exercises.filter(ex => ex.type === 'interval');
  const intervalCount = intervalExercises.length;
  const totalBlocks = intervalExercises.reduce((sum, ex) => sum + (ex.blocks ? ex.blocks.length : 1), 0);
  const isQuickWorkout = workout.duration && workout.duration < 1800;

  const exerciseNames = workout.exercises
    .map(ex => movements.find(m => m.id === ex.movementId)?.name || 'Unknown')
    .slice(0, 3);

  const moreCount = workout.exercises.length - 3;

  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{workout.templateName}</h4>
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: difficultyInfo.color }}
            >
              {difficultyInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date(workout.startTime).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
            {workout.duration && ` • ${formatTime(workout.duration)}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {exerciseNames.map((name, i) => (
              <Badge key={i} color="blue">{name}</Badge>
            ))}
            {moreCount > 0 && (
              <Badge color="gray">+{moreCount} more</Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalSets}</span>
            {isQuickWorkout && (
              <span className="text-yellow-500" title="Quick workout (under 30 min)">
                <Icons.Lightning />
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalSets > 0 ? 'sets' : ''}
            {totalSets > 0 && intervalCount > 0 ? ' + ' : ''}
            {intervalCount > 0 ? (
              totalBlocks > intervalCount
                ? `${totalBlocks} blocks`
                : `${intervalCount} interval${intervalCount !== 1 ? 's' : ''}`
            ) : ''}
            {totalSets === 0 && intervalCount === 0 ? 'sets' : ''}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WorkoutSummaryCard;
