/**
 * @file Core data shapes for the fitness tracker. Single source of truth.
 *
 * When a shape changes, update this file in the same commit. Typedefs are
 * referenced from other files via `import('./types').TypeName` syntax.
 *
 * Notes on shape specifics:
 * - `Workout` has two structurally different states: `ActiveWorkout` (in
 *   progress — uses `plannedSets`) and `HistoryWorkout` (saved — uses `sets`).
 *   Most functions accept either; use `Workout` when you mean "could be
 *   either state."
 * - The exercise discriminator `type` is reliable for interval exercises
 *   (always set) but NOT set on sets-based exercises in current code paths.
 *   The typedefs reflect this: `IntervalExercise.type` is required,
 *   `SetsExercise.type` is optional. Narrowing via `if (ex.type === 'interval')`
 *   works correctly regardless.
 */

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

/** @typedef {'lbs' | 'kg'} Unit */

/** @typedef {1 | 2 | 3 | 4 | null} Tier */

/** @typedef {0 | 1 | 2 | 3 | 4 | 5} Difficulty */

/** @typedef {'sets' | 'interval'} ExerciseType */

/** @typedef {'light' | 'dark' | 'system'} Theme */

// -----------------------------------------------------------------------------
// Entities
// -----------------------------------------------------------------------------

/**
 * A named exercise with associated body parts.
 * @typedef {object} Movement
 * @property {string} id
 * @property {string} name
 * @property {string[]} bodyParts
 */

/**
 * User preferences. Stored under `fitness_settings`.
 * @typedef {object} Settings
 * @property {Unit} defaultUnit
 * @property {Theme} [theme] - defaults to 'system' when unset
 */

// -----------------------------------------------------------------------------
// Templates
// -----------------------------------------------------------------------------

/**
 * A movement entry in a template configured as sets-based.
 * @typedef {object} SetsTemplateMovement
 * @property {string} movementId
 * @property {'sets'} type
 * @property {number | null} sets - target number of sets; null means "use last"
 * @property {Unit | null} unit - null means "use settings.defaultUnit"
 * @property {Tier} tier
 * @property {number} workDuration - unused for sets-based but present for schema uniformity
 * @property {number} restDuration - unused for sets-based but present for schema uniformity
 * @property {number} rounds - unused for sets-based but present for schema uniformity
 */

/**
 * A movement entry in a template configured as interval-based.
 * @typedef {object} IntervalTemplateMovement
 * @property {string} movementId
 * @property {'interval'} type
 * @property {null} sets
 * @property {null} unit
 * @property {null} tier
 * @property {number} workDuration - seconds of work per round
 * @property {number} restDuration - seconds of rest between rounds
 * @property {number} rounds
 */

/** @typedef {SetsTemplateMovement | IntervalTemplateMovement} TemplateMovement */

/**
 * A reusable workout blueprint.
 * @typedef {object} Template
 * @property {string} id
 * @property {string} name
 * @property {TemplateMovement[]} movements
 */

// -----------------------------------------------------------------------------
// Sets and blocks
// -----------------------------------------------------------------------------

/**
 * A set during an active workout. Mutated in place as the user logs reps.
 * @typedef {object} PlannedSet
 * @property {number} weight
 * @property {number | null} reps - null until the user logs reps for this set
 * @property {Difficulty} difficulty
 * @property {boolean} [isGo] - "GO" button state in the set circle UI
 * @property {number} [restTime] - seconds; set after the rest timer completes
 * @property {number} [repStartTime] - epoch ms; set when the user starts reps
 */

/**
 * A completed set as saved in workout history.
 * @typedef {object} CompletedSet
 * @property {string} id
 * @property {number} weight
 * @property {number} reps
 * @property {Difficulty} difficulty
 * @property {number | null} restTime - seconds, or null if not tracked
 * @property {Unit} unit
 * @property {string} timestamp - ISO 8601
 */

/**
 * A completed round within an interval exercise.
 * @typedef {object} IntervalBlock
 * @property {Difficulty} difficulty
 * @property {number} totalTime - seconds elapsed during the block
 */

// -----------------------------------------------------------------------------
// Exercises — active
// -----------------------------------------------------------------------------

/**
 * Sets-based exercise during an active workout.
 * NOTE: `type` is optional because current code paths do not set it on
 * sets-based exercises. `type === 'interval'` is the reliable discriminator.
 * @typedef {object} ActiveSetsExercise
 * @property {string} movementId
 * @property {'sets'} [type]
 * @property {Unit} unit
 * @property {boolean} perDumbbell
 * @property {PlannedSet[]} plannedSets
 * @property {Tier} [tier]
 * @property {boolean} [progressed] - true when auto-progression bumped the weight
 * @property {boolean} [isComplete] - toggled via "mark complete" button
 * @property {number | null} [completionTime] - ms from firstRepTime to completion
 * @property {number} [firstRepTime] - epoch ms when the first rep was logged
 */

/**
 * Interval-based exercise during an active workout.
 * @typedef {object} ActiveIntervalExercise
 * @property {string} movementId
 * @property {'interval'} type
 * @property {number} workDuration
 * @property {number} restDuration
 * @property {number} rounds
 * @property {IntervalBlock[]} blocks - filled as rounds complete
 * @property {Difficulty} currentBlockDifficulty
 * @property {boolean} isComplete
 * @property {boolean} [weighted]
 * @property {number | null} [weight]
 * @property {Unit} [unit]
 * @property {boolean} [perDumbbell]
 * @property {boolean} [isOneSide]
 * @property {boolean} [ignoreBarWeight]
 * @property {number | null} [barWeight]
 */

/** @typedef {ActiveSetsExercise | ActiveIntervalExercise} ActiveExercise */

// -----------------------------------------------------------------------------
// Exercises — history
// -----------------------------------------------------------------------------

/**
 * Sets-based exercise as saved in workout history.
 * Same optionality note as `ActiveSetsExercise.type`.
 * @typedef {object} HistorySetsExercise
 * @property {string} movementId
 * @property {'sets'} [type]
 * @property {Unit} unit
 * @property {boolean} perDumbbell
 * @property {CompletedSet[]} sets
 * @property {number | null} [completionTime]
 */

/**
 * Interval exercise as saved in workout history.
 * @typedef {object} HistoryIntervalExercise
 * @property {string} movementId
 * @property {'interval'} type
 * @property {number} workDuration
 * @property {number} restDuration
 * @property {number} rounds
 * @property {IntervalBlock[]} blocks
 * @property {boolean} isComplete
 * @property {boolean} weighted
 * @property {number | null} weight
 * @property {Unit} unit
 * @property {boolean} perDumbbell
 * @property {CompletedSet[]} sets - always empty for intervals; present for backward compat
 */

/** @typedef {HistorySetsExercise | HistoryIntervalExercise} HistoryExercise */

/** @typedef {ActiveExercise | HistoryExercise} Exercise */

// -----------------------------------------------------------------------------
// Workouts
// -----------------------------------------------------------------------------

/**
 * A workout currently in progress. Persisted under `fitness_activeWorkout`.
 * @typedef {object} ActiveWorkout
 * @property {string} id
 * @property {string} startTime - ISO 8601
 * @property {string | null} templateId
 * @property {string} templateName
 * @property {ActiveExercise[]} exercises
 * @property {Unit} unit
 */

/**
 * A completed workout saved in history.
 * @typedef {object} HistoryWorkout
 * @property {string} id
 * @property {string} startTime - ISO 8601
 * @property {string} endTime - ISO 8601
 * @property {number} duration - seconds
 * @property {string | null} templateId
 * @property {string} templateName
 * @property {HistoryExercise[]} exercises
 * @property {Unit} unit
 * @property {string | null} [notes]
 */

/** @typedef {ActiveWorkout | HistoryWorkout} Workout */

// -----------------------------------------------------------------------------
// Auxiliary shapes (function return types, prop helpers)
// -----------------------------------------------------------------------------

/**
 * Return shape of `getLastExerciseData` in `utils/workoutUtils.js`.
 * @typedef {object} LastExerciseData
 * @property {number} weight
 * @property {number} sets
 * @property {boolean} perDumbbell
 */

/**
 * Return shape of `calculateAutoProgression` in `utils/workoutUtils.js`.
 * @typedef {object} AutoProgressionResult
 * @property {number} weight
 * @property {number} sets
 * @property {boolean} perDumbbell
 * @property {boolean} progressed
 * @property {number} [previousWeight]
 */

/**
 * Return shape of `getLastExerciseMaxWeight` in `utils/workoutUtils.js`.
 * @typedef {object} LastExerciseMaxWeight
 * @property {number} weight
 * @property {number} reps
 * @property {Unit} unit
 * @property {boolean} perDumbbell
 */

/**
 * Return shape of `getDifficultyInfo` in `utils/workoutUtils.js`.
 * @typedef {object} DifficultyInfo
 * @property {string} label
 * @property {string} color - hex color
 */

// Empty export so this file is treated as a module by the editor.
export {};
