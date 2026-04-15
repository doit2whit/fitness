import { DEFAULT_WEIGHT, DEFAULT_SETS, TIER_REP_THRESHOLDS, WEIGHT_INCREMENT } from './constants';

/**
 * Average difficulty across all rated sets/blocks in a completed workout.
 * Rating 0 ("None") is excluded from the average.
 *
 * @param {import('../types').HistoryWorkout} workout
 * @returns {number} average, or 0 if nothing was rated
 */
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
      } else {
        // Legacy single-difficulty interval exercises
        const legacyDifficulty = /** @type {{ difficulty?: number }} */ (exercise).difficulty;
        if (legacyDifficulty && legacyDifficulty > 0) {
          totalDifficulty += legacyDifficulty;
          ratingCount++;
        }
      }
    } else {
      // Sets-based exercises
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

/**
 * Map a numeric average difficulty to a label + color.
 *
 * @param {number} avgDifficulty
 * @returns {import('../types').DifficultyInfo}
 */
export const getDifficultyInfo = (avgDifficulty) => {
  if (avgDifficulty === 0) return { label: 'N/A', color: '#9ca3af' };
  if (avgDifficulty <= 1.5) return { label: 'Very Easy', color: '#1e40af' };
  if (avgDifficulty <= 2.5) return { label: 'Easy', color: '#60a5fa' };
  if (avgDifficulty <= 3.5) return { label: 'Moderate', color: '#f97316' };
  if (avgDifficulty <= 4.5) return { label: 'Hard', color: '#fca5a5' };
  return { label: 'Very Hard', color: '#dc2626' };
};

/**
 * Find the most recent use of a movement in history, returning the data needed
 * to prefill the next exercise (weight from the first set, set count, per-dumbbell flag).
 *
 * @param {string} movementId
 * @param {import('../types').HistoryWorkout[]} workoutHistory - newest-first
 * @param {import('../types').Unit} defaultUnit - unused; kept for call-site compatibility
 * @returns {import('../types').LastExerciseData}
 */
// eslint-disable-next-line no-unused-vars
export const getLastExerciseData = (movementId, workoutHistory, defaultUnit) => {
  for (const workout of workoutHistory) {
    const exercise = workout.exercises.find(ex => ex.movementId === movementId);
    if (exercise && exercise.type !== 'interval' && exercise.sets.length > 0) {
      const lastWeight = exercise.sets[0].weight;
      const lastSets = exercise.sets.length;
      return { weight: lastWeight, sets: lastSets, perDumbbell: exercise.perDumbbell || false };
    }
  }
  return { weight: DEFAULT_WEIGHT, sets: DEFAULT_SETS, perDumbbell: false };
};

/**
 * Find the max weight used across sets in the most recent use of a movement.
 *
 * @param {string} movementId
 * @param {import('../types').HistoryWorkout[]} workoutHistory - newest-first
 * @returns {import('../types').LastExerciseMaxWeight | null}
 */
export const getLastExerciseMaxWeight = (movementId, workoutHistory) => {
  for (const workout of workoutHistory) {
    const exercise = workout.exercises.find(ex => ex.movementId === movementId);
    if (exercise && exercise.type !== 'interval' && exercise.sets.length > 0) {
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

/**
 * Total weight × reps across sets-based exercises in a completed workout.
 * Interval exercises are skipped.
 *
 * @param {import('../types').HistoryWorkout} workout
 * @returns {number}
 */
export const calculateWorkoutVolume = (workout) => {
  let total = 0;
  workout.exercises.forEach(exercise => {
    if (exercise.type === 'interval') return;
    exercise.sets.forEach(set => {
      if (set.reps !== null && set.reps !== undefined) {
        total += set.weight * set.reps;
      }
    });
  });
  return total;
};

/**
 * Total time (seconds) an interval exercise occupies — work every round plus
 * rest between rounds (not after the last one).
 *
 * @param {import('../types').ActiveIntervalExercise | import('../types').HistoryIntervalExercise | import('../types').IntervalTemplateMovement} exercise
 * @returns {number} seconds
 */
export const calculateIntervalDuration = (exercise) => {
  if (exercise.type !== 'interval') return 0;
  const { workDuration = 0, restDuration = 0, rounds = 0 } = exercise;
  return (workDuration * rounds) + (restDuration * Math.max(0, rounds - 1));
};

/**
 * Convert the old template-movement format (array of string IDs) into the
 * current format (array of config objects). Idempotent — already-new templates
 * pass through unchanged.
 *
 * @param {import('../types').Template | { id: string, name: string, movements: (string | import('../types').TemplateMovement)[] }} template
 * @returns {import('../types').Template}
 */
export const migrateTemplate = (template) => {
  if (!template.movements || template.movements.length === 0) {
    return /** @type {import('../types').Template} */ (template);
  }
  const first = template.movements[0];
  // Already new format — movements[0] is an object with movementId
  if (typeof first === 'object' && first !== null && 'movementId' in first) {
    return /** @type {import('../types').Template} */ (template);
  }
  // Old format — convert string IDs to config objects
  return {
    ...template,
    movements: /** @type {string[]} */ (template.movements).map(movementId => (
      /** @type {import('../types').SetsTemplateMovement} */ ({
        movementId,
        type: 'sets',
        sets: null,
        unit: null,
        tier: null,
        workDuration: 0,
        restDuration: 0,
        rounds: 0
      })
    ))
  };
};

/**
 * Compute the starting weight for a tiered movement on a new workout.
 * If the user met the rep threshold on ALL sets last time they ran this
 * template, bump the weight by one increment; otherwise repeat last weight.
 *
 * @param {string} movementId
 * @param {import('../types').Tier} tier
 * @param {import('../types').Unit} unit
 * @param {string | null} templateId - the template being started; matches history by `templateId`
 * @param {import('../types').HistoryWorkout[]} workoutHistory - newest-first
 * @param {import('../types').Unit} defaultUnit
 * @returns {import('../types').AutoProgressionResult}
 */
export const calculateAutoProgression = (movementId, tier, unit, templateId, workoutHistory, defaultUnit) => {
  const fallback = getLastExerciseData(movementId, workoutHistory, defaultUnit);

  // No tier = no auto-progression, just use last weight
  if (!tier) return { ...fallback, progressed: false };

  const repThreshold = TIER_REP_THRESHOLDS[tier];
  if (!repThreshold) return { ...fallback, progressed: false };

  // Find most recent workout with matching templateId
  const lastTemplateWorkout = workoutHistory.find(w => w.templateId === templateId);

  if (!lastTemplateWorkout) {
    return { ...fallback, progressed: false };
  }

  const exercise = lastTemplateWorkout.exercises.find(ex => ex.movementId === movementId);
  if (!exercise || exercise.type === 'interval' || !exercise.sets || exercise.sets.length === 0) {
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

/**
 * Normalize a template movement entry — handles both the old string-ID format
 * and the new config-object format. Use this when reading from a template of
 * unknown provenance.
 *
 * @param {string | import('../types').TemplateMovement} movementEntry
 * @returns {import('../types').TemplateMovement}
 */
export const getMovementConfig = (movementEntry) => {
  if (typeof movementEntry === 'string') {
    return /** @type {import('../types').SetsTemplateMovement} */ ({
      movementId: movementEntry,
      type: 'sets',
      sets: null,
      unit: null,
      tier: null,
      workDuration: 0,
      restDuration: 0,
      rounds: 0
    });
  }
  return movementEntry;
};
