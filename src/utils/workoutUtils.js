import { DEFAULT_WEIGHT, DEFAULT_SETS } from './constants';

export const getWorkoutAvgDifficulty = (workout) => {
  let totalDifficulty = 0;
  let ratingCount = 0;
  workout.exercises.forEach(exercise => {
    if (exercise.type === 'interval') {
      // Interval exercises store a single difficulty at the exercise level
      if (exercise.difficulty > 0) {
        totalDifficulty += exercise.difficulty;
        ratingCount++;
      }
    } else {
      // Sets-based exercises store difficulty per set
      exercise.sets.forEach(set => {
        if (set.difficulty > 0) {
          totalDifficulty += set.difficulty;
          ratingCount++;
        }
      });
    }
  });
  return ratingCount > 0 ? totalDifficulty / ratingCount : 0;
};

export const getDifficultyInfo = (avgDifficulty) => {
  if (avgDifficulty === 0) return { label: 'N/A', color: '#9ca3af' };
  if (avgDifficulty <= 1.5) return { label: 'Very Easy', color: '#1e40af' };
  if (avgDifficulty <= 2.5) return { label: 'Easy', color: '#60a5fa' };
  if (avgDifficulty <= 3.5) return { label: 'Moderate', color: '#f97316' };
  if (avgDifficulty <= 4.5) return { label: 'Hard', color: '#fca5a5' };
  return { label: 'Very Hard', color: '#dc2626' };
};

export const getLastExerciseData = (movementId, workoutHistory, defaultUnit) => {
  for (const workout of workoutHistory) {
    const exercise = workout.exercises.find(ex => ex.movementId === movementId);
    if (exercise && exercise.sets.length > 0) {
      const lastWeight = exercise.sets[0].weight;
      const lastSets = exercise.sets.length;
      return { weight: lastWeight, sets: lastSets };
    }
  }
  return { weight: DEFAULT_WEIGHT, sets: DEFAULT_SETS };
};

export const getLastExerciseMaxWeight = (movementId, workoutHistory) => {
  for (const workout of workoutHistory) {
    const exercise = workout.exercises.find(ex => ex.movementId === movementId);
    if (exercise && exercise.sets.length > 0) {
      let maxWeight = 0;
      let repsAtMax = 0;
      exercise.sets.forEach(set => {
        if (set.weight > maxWeight) {
          maxWeight = set.weight;
          repsAtMax = set.reps;
        }
      });
      return { weight: maxWeight, reps: repsAtMax, unit: workout.unit || 'lbs' };
    }
  }
  return null;
};

export const calculateWorkoutVolume = (workout) => {
  let total = 0;
  workout.exercises.forEach(exercise => {
    // Skip interval exercises — no weight × reps to calculate
    if (exercise.type === 'interval') return;
    exercise.sets.forEach(set => {
      if (set.reps !== null && set.reps !== undefined) {
        total += set.weight * set.reps;
      }
    });
  });
  return total;
};

export const calculateIntervalDuration = (exercise) => {
  if (exercise.type !== 'interval') return 0;
  const { workDuration = 0, restDuration = 0, rounds = 0 } = exercise;
  // Work for every round, rest between rounds (not after the last one)
  return (workDuration * rounds) + (restDuration * Math.max(0, rounds - 1));
};
