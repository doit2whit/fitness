# Architecture

This document covers non-obvious behaviors, data flow, and the storage layer. Read it before making substantive changes — most of what's surprising about this codebase is described here. For the quick orientation (stack, conventions, where files live), see [`CLAUDE.md`](../CLAUDE.md).

## Structure map

### `src/FitnessTracker.jsx`
The app shell. Responsibilities:
- Owns every piece of persistent app state (movements, body parts, workout history, templates, settings, backup counter, active workout, deleted-defaults list).
- Tab routing via a local `activeTab` state — no router library.
- Theme management: reads `settings.theme`, toggles `.dark` on `<html>`, updates meta `theme-color`, and listens for system theme changes when theme is `'system'`.
- Runs load-time migrations (template format) and default-merging (movements, templates) in useEffects with empty dependency arrays.
- Drives the backup reminder modal when `workoutHistory.length - lastBackupCount >= 3`.

### `src/components/features/`
Tab-level views and workout-specific components. Notable files:
- `ActiveWorkout.jsx` — workout lifecycle orchestrator (idle → active → completed). Handles template startup, backdating, and hands off to the per-exercise tracker.
- `ExerciseTracker.jsx` — sets-based exercise UI. Scrollable list of set circles; tap to cycle through states, long-press to reset.
- `IntervalTracker.jsx` — interval exercise UI with work/rest/round timer and per-block difficulty ratings. Uses `useWakeLock` to keep the screen on during active work.
- `WorkoutTemplates.jsx` — template CRUD. Per-movement config includes sets count, interval timing, unit, and tier.
- `MovementManager.jsx` — movement and body-part management.
- `TrendsView.jsx` — Recharts-backed progress charts, split by exercise type.
- `CalendarView.jsx` — month grid colored by average daily difficulty.
- `SettingsView.jsx` — preferences, import/export, stats.
- `WorkoutDetailView.jsx` — read-only drill-down into a past workout.
- `WorkoutSummaryCard.jsx`, `AllWorkoutsView.jsx`, `FloatingRestTimer.jsx`, `TimerDisplay.jsx`, `SetCircle.jsx`, `WeightInputSetup.jsx` — supporting components.

### `src/components/ui/`
Generic primitives with no domain knowledge: `Button`, `Card`, `Modal`, `ConfirmDialog`, `Input`, `Select`, `Tabs`, `NumberStepper`, `TimeStepper`, `Badge`.

### `src/hooks/`
- `useLocalStorage` — the persistence primitive; wraps `useState` and syncs to `localStorage` on change.
- `useTimer`, `useIntervalTimer` — timer state machines for workout duration and intervals.
- `useWakeLock` — keeps the screen on during active work.
- `useLongPress` — press-and-hold gesture for reset actions.

### `src/utils/`
- `constants.js` — `STORAGE_KEYS`, `DEFAULT_MOVEMENTS`, `DEFAULT_BODY_PARTS`, `DEFAULT_TEMPLATES`, `DIFFICULTY_LEVELS`, tier system constants (`TIER_LABELS`, `TIER_REP_THRESHOLDS`, `WEIGHT_INCREMENT`), default bar weight, default durations.
- `workoutUtils.js` — domain logic: `calculateAutoProgression`, `migrateTemplate`, `getMovementConfig`, `getWorkoutAvgDifficulty`, `getDifficultyInfo`, `getLastExerciseData`, `getLastExerciseMaxWeight`, `calculateWorkoutVolume`, `calculateIntervalDuration`.
- `helpers.js` — `generateId`, `formatTime`, `getDateKey`, `kgToLbs`.
- `storage.js` — `loadFromStorage`, `saveToStorage` (thin try/catch wrappers around `localStorage`).

### `src/types.js`
JSDoc `@typedef`s for every core data shape — the single source of truth. Other files reference types via `import('./types').TypeName` syntax (no runtime import; the editor resolves it). When a data shape changes, update `src/types.js` in the same commit or the types drift.

**Notable discriminator quirk**: `type: 'sets'` is NOT set on sets-based exercises in current code paths — only `type: 'interval'` is reliable. Typedefs reflect this: `IntervalExercise.type` is required, `SetsExercise.type` is optional. Narrowing via `if (ex.type === 'interval')` still works correctly.

## State management

### The useLocalStorage pattern
`src/hooks/useLocalStorage.js` is the single persistence primitive. It:
1. Initializes state from `localStorage` on mount (falling back to the provided default).
2. Writes to `localStorage` in a `useEffect` whenever the value changes.

Every piece of persistent app state uses this hook. Components never touch `localStorage` directly — this keeps the read/write paths uniform and easy to migrate.

### All state lives in `FitnessTracker.jsx`
App-wide state is declared at the top of `FitnessTracker.jsx` and passed down as props. This is deliberate:
- The app is small enough that prop drilling isn't painful.
- No context/Redux ceremony needed.
- Every stateful piece of the app is visible in one place.

If a component needs shared state, lift it to `FitnessTracker.jsx`. Do not introduce context unless the prop-passing becomes clearly harmful.

### Active workout persists separately from history
While a workout is in progress:
- `STORAGE_KEYS.activeWorkout` holds the in-progress workout object.
- `STORAGE_KEYS.activeWorkoutFlag` is a boolean indicating a workout is in progress.

Only when the user ends the workout does it get prepended to `STORAGE_KEYS.workoutHistory` (history is stored newest-first). This means a page refresh mid-workout preserves all progress — intentional for mobile use where tabs close unexpectedly.

## Data flow

A workout moves through three states:

1. **Template** (`STORAGE_KEYS.workoutTemplates`). A reusable blueprint — name + list of movements with per-movement config (type, sets count, unit, tier, or interval timing).
2. **Active workout** (`STORAGE_KEYS.activeWorkout`). Created from a template (or blank) when the user starts a session. Exercises accumulate completed sets, reps, weights, and difficulty ratings in real time.
3. **Workout history** (`STORAGE_KEYS.workoutHistory`). When the user ends the workout, it's prepended to the history array (newest first). The active workout state is cleared.

Backdating is supported via a date picker in `ActiveWorkout.jsx`: the user can select a past date before starting the workout, which sets `startTime` on the new workout. The workout still runs through the active-workout flow; only the recorded date changes.

## Non-obvious behaviors

### Tier-based auto-progression
Implemented in `calculateAutoProgression` at [`src/utils/workoutUtils.js:117`](../src/utils/workoutUtils.js).

- Templates assign a tier (1–4) to each sets-based movement via the `tier` field.
- Tiers map to rep thresholds via `TIER_REP_THRESHOLDS` in `constants.js`: T1 = 6, T2 = 10, T3 = 12, T4 = 15.
- Weight increments by `WEIGHT_INCREMENT[unit]` (5 lbs / 2.5 kg) **only if all sets met the threshold** in the most recent use of this template.
- Matches the last workout by `templateId`. If this template hasn't been used before, falls back to the most recent use of the movement in any workout.
- Untiered movements (tier = null) don't auto-progress — they just prefill from the last use.

**Known issue:** the "last weight" currently comes from `exercise.sets[0].weight` rather than the max across sets. If sets use different weights within a session, this can under- or over-shoot. A planned fix will switch to max-weight. `getLastExerciseMaxWeight` already exists for this purpose.

### Template format migration
Older templates stored movements as an array of string IDs. Newer templates store them as config objects (`{ movementId, type, sets, unit, tier, workDuration, restDuration, rounds }`).

- `migrateTemplate` in [`src/utils/workoutUtils.js:94`](../src/utils/workoutUtils.js) converts the old shape to the new.
- The migration runs once at app load via a useEffect in `FitnessTracker.jsx` (near line 64), and writes back through `setTemplates` if any templates needed conversion.
- `getMovementConfig` in `workoutUtils.js` is a defensive reader that handles either shape — use it when reading from a template of unknown provenance.

### Default merge-on-load
New default movements and templates get added to existing users' data on app load. Implementation in the useEffect at `FitnessTracker.jsx` near line 74.

- Movements are matched by case-insensitive name. Anything in `DEFAULT_MOVEMENTS` not already present gets appended.
- Templates are matched by case-insensitive name. Defaults that the user has previously deleted are tracked in `STORAGE_KEYS.deletedDefaultTemplates` (an array of default template IDs) and are NOT re-added. This is how we respect user deletions of defaults across version updates.

If a default is updated (not added new), the change does NOT propagate to existing users — their copy remains whatever it was. This is intentional; users may have customized it.

### Weight input: per-dumbbell and one-side entry
`WeightInputSetup.jsx` supports three input modes for sets-based exercises:
- **Total weight** (default) — user enters the combined weight.
- **One-side entry** — user enters the weight per side; the component computes `side × 2 + bar`. Bar weight defaults to `DEFAULT_BAR_WEIGHT[unit]` (45 lbs / 20 kg) but is overridable per-exercise via `barWeight`.
- **One-side entry + ignore bar** — user enters per-side weight with no bar added (`side × 2`). Used for movements without a bar.

Per-dumbbell tracking is a separate concept (the `perDumbbell` flag on an exercise) — it flags that the weight is per-dumbbell rather than total, and is preserved through history and progression.

### Backup reminder
`FitnessTracker.jsx` (near line 100) watches `workoutHistory.length - lastBackupCount`. When the delta reaches 3, the backup reminder modal is shown. Accepting the export (JSON, CSV, or email) updates `lastBackupCount` to the current history length; skipping permanently updates it as well (the user chose not to back up, we don't keep nagging for the same workouts). Dismissing without skipping re-shows on next mount.

### Difficulty scale
`DIFFICULTY_LEVELS` in `constants.js` is 0–5:
- 0 = None (unrated)
- 1 = Very Easy
- 2 = Easy
- 3 = Moderate
- 4 = Hard
- 5 = Very Hard

Rating 0 is **excluded** from averaging in `getWorkoutAvgDifficulty` (`workoutUtils.js`). This matters for the calendar heatmap and workout summary cards — unrated sets don't drag the average toward zero.

## Storage schema

All keys live in `STORAGE_KEYS` in `src/utils/constants.js`. Shape names below refer to typedefs in `src/types.js`.

| Key | Shape | Purpose |
|---|---|---|
| `fitness_movements` | `Movement[]` | User's movement library (merged with defaults on load) |
| `fitness_bodyParts` | `string[]` | Available body part tags |
| `fitness_workoutHistory` | `HistoryWorkout[]` | Completed workouts, newest first |
| `fitness_workoutTemplates` | `Template[]` | Reusable workout blueprints |
| `fitness_settings` | `Settings` | User preferences (`defaultUnit`, optional `theme`) |
| `fitness_lastBackupCount` | `number` | History length at last backup export |
| `fitness_activeWorkout` | `ActiveWorkout \| null` | In-progress workout, persisted for refresh resilience |
| `fitness_activeWorkout_active` | `boolean` | Flag indicating a workout is currently in progress |
| `fitness_deletedDefaultTemplates` | `string[]` | IDs of default templates the user deleted; prevents re-merge |

### Migration strategy
There is no versioned migration system. Schema changes are handled by load-time useEffects in `FitnessTracker.jsx` that detect and rewrite old-shaped data in place (see template migration above).

This is adequate while schema changes are infrequent and additive. If the app ever needs a genuine breaking migration (e.g., restructuring `workoutHistory`), introduce a version field in settings and a proper migration chain. Flag this moment when it arrives.

## Routing

No router library. Navigation is a tab bar — `activeTab` state in `FitnessTracker.jsx` toggles which feature view renders. URL does not reflect current tab; browser back/forward does not work for tab navigation. This is acceptable for a single-user mobile app; reconsider if we ever add deep-linking or multi-page flows.
