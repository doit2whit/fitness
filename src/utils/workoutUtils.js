import { DEFAULT_WEIGHT, DEFAULT_SETS, TIER_REP_THRESHOLDS, WEIGHT_INCREMENT } from './constants';

export const getWorkoutAvgDifficulty = (workout) => {
  let totalDifficulty = 0;
  let ratingCount = 0;
  workout.exercises.forEach(exercise => {
    if (exercise.type === 'interval') {
      // Interval exercises store difficulty per block (or as a single value for backward compat)
      if (exercise.blocks && exercise.blocks.length > 0) {
        exercise.blocks.forEach(block => {
          if (block.difficulty > 0) {
            totalDifficulty += block.difficulty;
            ratingCount++;
          }
        });
      } else if (exercise.difficulty > 0) {
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
      return { weight: lastWeight, sets: lastSets, perDumbbell: exercise.perDumbbell || false };
    }
  }
  return { weight: DEFAULT_WEIGHT, sets: DEFAULT_SETS, perDumbbell: false };
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
      return { weight: maxWeight, reps: repsAtMax, unit: workout.unit || 'lbs', perDumbbell: exercise.perDumbbell || false };
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

// Migrate old template format (movement ID strings) to new config objects
export const migrateTemplate = (template) => {
  if (!template.movements || template.movements.length === 0) return template;
  // Already new format — movements[0] is an object with movementId
  if (typeof template.movements[0] === 'object' && template.movements[0].movementId) {
    return template;
  }
  // Old format — convert string IDs to config objects
  return {
    ...template,
    movements: template.movements.map(movementId => ({
      movementId,
      type: 'sets',
      sets: null,
      unit: null,
      tier: null,
      workDuration: null,
      restDuration: null,
      rounds: null
    }))
  };
};

// Calculate auto-progression weight for a tiered movement
export const calculateAutoProgression = (movementId, tier, unit, templateId, workoutHistory, defaultUnit) => {
  const fallback = getLastExerciseData(movementId, workoutHistory, defaultUnit);

  // No tier = no auto-progression, just use last weight
  if (!tier) return { ...fallback, progressed: false };

  const repThreshold = TIER_REP_THRESHOLDS[tier];
  if (!repThreshold) return { ...fallback, progressed: false };

  // Find most recent workout with matching templateId
  const lastTemplateWorkout = workoutHistory.find(w => w.templateId === templateId);

  if (!lastTemplateWorkout) {
    // No previous use of this template — fall back to any historical use
    return { ...fallback, progressed: false };
  }

  const exercise = lastTemplateWorkout.exercises.find(ex => ex.movementId === movementId);
  if (!exercise || !exercise.sets || exercise.sets.length === 0) {
    return { ...fallback, progressed: false };
  }

  const lastWeight = exercise.sets[0].weight;
  const lastSets = exercise.sets.length;
  const perDumbbell = exercise.perDumbbell || false;

  // Check if ALL sets met the rep threshold
  const allSetsMet = exercise.sets.every(set => set.reps >= repThreshold);
  const increment = WEIGHT_INCREMENT[unit] || WEIGHT_INCREMENT['lbs'];

  if (allSetsMet) {
    return {
      weight: lastWeight + increment,
      sets: lastSets,
      perDumbbell,
      progressed: true,
      previousWeight: lastWeight
    };
  }

  return { weight: lastWeight, sets: lastSets, perDumbbell, progressed: false };
};

// Helper to safely read a movement config (handles both old and new format)
export const getMovementConfig = (movementEntry) => {
  if (typeof movementEntry === 'string') {
    return { movementId: movementEntry, type: 'sets', sets: null, unit: null, tier: null };
  }
  return movementEntry;
};
