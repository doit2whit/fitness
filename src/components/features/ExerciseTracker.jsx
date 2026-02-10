import React, { useState } from 'react';
import { TIER_LABELS, WEIGHT_INCREMENT } from '../../utils/constants';
import { formatTime } from '../../utils/helpers';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import SetCircle from './SetCircle';
import FloatingRestTimer from './FloatingRestTimer';

const ExerciseTracker = ({
  exercise,
  movementName,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onUpdateExercise,
  onMarkComplete,
  defaultUnit
}) => {
  const [editingWeightIndex, setEditingWeightIndex] = useState(null);
  const [tempWeight, setTempWeight] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const exerciseUnit = exercise.unit || defaultUnit;

  const handleWeightClick = (index) => {
    setEditingWeightIndex(index);
    setTempWeight(exercise.plannedSets[index].weight.toString());
  };

  const handleWeightSave = (index) => {
    const newWeight = parseFloat(tempWeight);
    if (!isNaN(newWeight) && newWeight > 0) {
      onUpdateSet(index, { weight: newWeight });
    }
    setEditingWeightIndex(null);
  };

  const handleCircleClick = (index) => {
    const set = exercise.plannedSets[index];
    const currentReps = set.reps;
    const isCurrentlyGo = set.isGo;

    if (!isCurrentlyGo && (currentReps === null || currentReps === undefined)) {
      onUpdateSet(index, { isGo: true, reps: null });
    } else if (isCurrentlyGo && (currentReps === null || currentReps === undefined || currentReps === 0)) {
      onUpdateSet(index, { isGo: false, reps: 1, repStartTime: Date.now() });
    } else {
      onUpdateSet(index, { reps: (currentReps || 0) + 1 });
    }
  };

  const handleCircleLongPress = (index) => {
    onUpdateSet(index, { reps: null, difficulty: 0, isGo: false, restTime: null, repStartTime: null });
  };

  const handleDifficultyClick = (index) => {
    const currentDifficulty = exercise.plannedSets[index].difficulty || 0;
    const newDifficulty = currentDifficulty >= 5 ? 0 : currentDifficulty + 1;
    onUpdateSet(index, { difficulty: newDifficulty });
  };

  const handleRemoveSetClick = () => {
    if (exercise.plannedSets.length === 1) {
      setShowDeleteConfirm(true);
    } else {
      onRemoveSet();
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onRemoveExercise();
  };

  const handleUnitToggle = () => {
    const newUnit = exerciseUnit === 'lbs' ? 'kg' : 'lbs';
    onUpdateExercise({ unit: newUnit });
  };

  const handleToggleComplete = () => {
    onMarkComplete(!exercise.isComplete);
  };

  const lastSetWeight = exercise.plannedSets.length > 0
    ? exercise.plannedSets[exercise.plannedSets.length - 1].weight
    : 0;

  return (
    <>
      <Card className={`p-4 ${exercise.isComplete ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{movementName}</h4>
            {exercise.tier && TIER_LABELS[exercise.tier] && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold">
                {TIER_LABELS[exercise.tier]}
              </span>
            )}
            {exercise.progressed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">
                +{WEIGHT_INCREMENT[exerciseUnit] || 5} {exerciseUnit}
              </span>
            )}
            <button
              onClick={handleUnitToggle}
              className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
              title="Toggle unit"
            >
              {exerciseUnit}
            </button>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={exercise.perDumbbell || false}
                onChange={(e) => onUpdateExercise({ perDumbbell: e.target.checked })}
                className="w-3.5 h-3.5 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">per DB</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleComplete}
              className={`p-1.5 rounded transition-colors ${
                exercise.isComplete
                  ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200'
                  : 'text-gray-400 dark:text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              title={exercise.isComplete ? 'Mark incomplete' : 'Mark complete'}
            >
              <Icons.CheckCircle />
            </button>
            <button
              onClick={onRemoveExercise}
              className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
            >
              <Icons.Trash />
            </button>
          </div>
        </div>

        {exercise.isComplete && exercise.completionTime && (
          <div className="text-sm text-green-600 dark:text-green-400 mb-3">
            Completed in {formatTime(Math.round(exercise.completionTime / 1000))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 mr-2">
            <button
              onClick={() => onAddSet(lastSetWeight)}
              className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/30 hover:bg-green-200 text-green-700 dark:text-green-300 rounded transition-colors"
              title="Add set"
            >
              <Icons.ChevronUp />
            </button>
            <button
              onClick={handleRemoveSetClick}
              className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-700 rounded transition-colors"
              title="Remove set"
            >
              <Icons.ChevronDown />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
            {exercise.plannedSets.map((set, index) => (
              <div key={index} className="flex-shrink-0">
                {editingWeightIndex === index ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5" />
                    <input
                      type="number"
                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                      onBlur={() => handleWeightSave(index)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWeightSave(index)}
                      className="w-16 px-2 py-1 text-sm text-center border border-emerald-300 dark:border-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <div className="w-14 h-14" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Set {index + 1}</span>
                    <div className="w-14 h-6" />
                  </div>
                ) : (
                  <SetCircle
                    setIndex={index}
                    weight={set.weight}
                    reps={set.reps}
                    difficulty={set.difficulty || 0}
                    restTime={index > 0 ? exercise.plannedSets[index - 1].restTime : null}
                    isGo={set.isGo}
                    prevSetRepStartTime={index > 0 ? exercise.plannedSets[index - 1].repStartTime : null}
                    onWeightClick={() => handleWeightClick(index)}
                    onCircleClick={() => handleCircleClick(index)}
                    onCircleLongPress={() => handleCircleLongPress(index)}
                    onDifficultyClick={() => handleDifficultyClick(index)}
                    unit={exerciseUnit}
                  />
                )}
              </div>
            ))}
            {(() => {
              if (exercise.isComplete) return null;
              const lastSet = exercise.plannedSets[exercise.plannedSets.length - 1];
              const lastSetHasReps = lastSet && lastSet.reps !== null && lastSet.reps !== undefined && lastSet.reps > 0;
              const lastSetHasRepStartTime = lastSet && lastSet.repStartTime;
              if (lastSetHasReps && lastSetHasRepStartTime) {
                return <FloatingRestTimer lastSetRepStartTime={lastSet.repStartTime} />;
              }
              return null;
            })()}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Tap: empty → GO → reps • Hold 3s to clear • Tap ✓ when done
        </p>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Exercise?"
        message="Removing the last set will delete this exercise. Are you sure?"
      />
    </>
  );
};

export default ExerciseTracker;
