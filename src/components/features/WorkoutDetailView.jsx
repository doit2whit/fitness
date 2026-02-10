import React, { useState } from 'react';
import { DIFFICULTY_LEVELS } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import { getWorkoutAvgDifficulty, getDifficultyInfo } from '../../utils/workoutUtils';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';

const WorkoutDetailView = ({ workout, movements, onBack, onUpdateWorkout }) => {
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(workout.notes || '');

  const avgDifficulty = getWorkoutAvgDifficulty(workout);
  const difficultyInfo = getDifficultyInfo(avgDifficulty);
  const isQuickWorkout = workout.duration && workout.duration < 1800;

  const getMovementName = (id) => movements.find(m => m.id === id)?.name || 'Unknown';

  const handleChangeMovement = (exIndex, newMovementId) => {
    if (onUpdateWorkout) {
      const updatedExercises = [...workout.exercises];
      updatedExercises[exIndex] = { ...updatedExercises[exIndex], movementId: newMovementId };
      onUpdateWorkout({ ...workout, exercises: updatedExercises });
    }
    setEditingExerciseIndex(null);
  };

  const handleSaveNotes = () => {
    if (onUpdateWorkout) {
      onUpdateWorkout({ ...workout, notes });
    }
    setEditingNotes(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Icons.Back /> Back
      </button>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{workout.templateName}</h3>
              {isQuickWorkout && (
                <span className="text-yellow-500" title="Quick workout (under 30 min)">
                  <Icons.Lightning />
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date(workout.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <span
            className="text-sm px-3 py-1 rounded-full text-white font-medium"
            style={{ backgroundColor: difficultyInfo.color }}
          >
            Avg: {difficultyInfo.label}
          </span>
        </div>

        {workout.duration && (
          <div className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Icons.Timer />
            <span>Duration: {formatTime(workout.duration)}</span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Icons.Edit />
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Add notes about this workout..."
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setNotes(workout.notes || ''); setEditingNotes(false); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>Save</Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {workout.notes || <span className="text-gray-400 dark:text-gray-500 italic">No notes</span>}
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {workout.exercises.map((exercise, exIndex) => {
          // Interval exercise display
          if (exercise.type === 'interval') {
            const blocks = exercise.blocks || (exercise.difficulty > 0 ? [{ difficulty: exercise.difficulty, totalTime: 0 }] : []);
            return (
              <Card key={exIndex} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  {editingExerciseIndex === exIndex ? (
                    <select
                      value={exercise.movementId}
                      onChange={(e) => handleChangeMovement(exIndex, e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    >
                      {movements.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Icons.Interval />
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{getMovementName(exercise.movementId)}</h4>
                      </div>
                      <button
                        onClick={() => setEditingExerciseIndex(exIndex)}
                        className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 transition-colors"
                        title="Change exercise"
                      >
                        <Icons.Edit />
                      </button>
                    </>
                  )}
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 mb-2">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    {exercise.rounds} rounds × {formatTime(exercise.workDuration)} work / {formatTime(exercise.restDuration)} rest
                  </span>
                  {exercise.weighted && exercise.weight && (
                    <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                      — {exercise.weight} {exercise.unit || workout.unit}
                      {exercise.perDumbbell && <span className="text-xs opacity-75 ml-1">per DB</span>}
                    </span>
                  )}
                </div>
                {blocks.length > 0 && (
                  <div className="space-y-1.5">
                    {blocks.map((block, bIdx) => {
                      const diffLevel = block.difficulty > 0 ? DIFFICULTY_LEVELS[block.difficulty] : null;
                      return (
                        <div key={bIdx} className="flex items-center justify-between bg-gray-50 dark:bg-navy-900 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16">
                              Block {bIdx + 1}
                            </span>
                            {block.totalTime > 0 && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">{formatTime(block.totalTime)}</span>
                            )}
                          </div>
                          {diffLevel && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: diffLevel.color, color: diffLevel.textColor }}
                            >
                              {diffLevel.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          }

          // Sets-based exercise display (existing)
          const completedSets = exercise.sets.filter(s => s.reps !== null && s.reps !== undefined);
          if (completedSets.length === 0) return null;

          return (
            <Card key={exIndex} className="p-4">
              <div className="flex items-center justify-between mb-3">
                {editingExerciseIndex === exIndex ? (
                  <select
                    value={exercise.movementId}
                    onChange={(e) => handleChangeMovement(exIndex, e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  >
                    {movements.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{getMovementName(exercise.movementId)}</h4>
                    <button
                      onClick={() => setEditingExerciseIndex(exIndex)}
                      className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 transition-colors"
                      title="Change exercise"
                    >
                      <Icons.Edit />
                    </button>
                  </>
                )}
              </div>
              {exercise.completionTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Completed in {formatTime(exercise.completionTime)}
                </div>
              )}
              <div className="space-y-2">
                {completedSets.map((set, setIndex) => {
                  const diffLevel = DIFFICULTY_LEVELS[set.difficulty] || DIFFICULTY_LEVELS[0];
                  return (
                    <div key={setIndex} className="flex items-center justify-between bg-gray-50 dark:bg-navy-900 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-12">Set {setIndex + 1}</span>
                        <span className="font-medium">
                          {set.weight} {set.unit || workout.unit}
                          {exercise.perDumbbell && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">per DB</span>}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">× {set.reps} reps</span>
                        {set.restTime && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Rest: {formatTime(set.restTime)}
                          </span>
                        )}
                      </div>
                      {set.difficulty > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: diffLevel.color,
                            color: diffLevel.textColor
                          }}
                        >
                          {diffLevel.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutDetailView;
