import React, { useState, useEffect } from 'react';
import { DEFAULT_SETS, DEFAULT_BAR_WEIGHT, DEFAULT_WORK_DURATION, DEFAULT_REST_DURATION, DEFAULT_ROUNDS } from '../../utils/constants';
import { generateId, formatTime, getDateKey } from '../../utils/helpers';
import { getLastExerciseData, getLastExerciseMaxWeight, calculateWorkoutVolume } from '../../utils/workoutUtils';
import useTimer from '../../hooks/useTimer';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import NumberStepper from '../ui/NumberStepper';
import TimeStepper from '../ui/TimeStepper';
import TimerDisplay from './TimerDisplay';
import ExerciseTracker from './ExerciseTracker';
import IntervalTracker from './IntervalTracker';
import WeightInputSetup from './WeightInputSetup';
import WorkoutSummaryCard from './WorkoutSummaryCard';
import WorkoutDetailView from './WorkoutDetailView';
import AllWorkoutsView from './AllWorkoutsView';

const ActiveWorkout = ({ movements, setMovements, templates, workoutHistory, setWorkoutHistory, settings }) => {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState(null);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);

  const [workoutDate, setWorkoutDate] = useState(() => getDateKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newExercise, setNewExercise] = useState({
    movementId: '',
    plannedSets: DEFAULT_SETS,
    startingWeight: '',
    isOneSide: false,
    barWeight: '',
    ignoreBarWeight: false,
    exerciseUnit: null,
    // Interval fields
    exerciseType: 'sets',  // 'sets' or 'interval'
    workDuration: DEFAULT_WORK_DURATION,
    restDuration: DEFAULT_REST_DURATION,
    rounds: DEFAULT_ROUNDS
  });

  const workoutTimer = useTimer(isWorkoutActive);

  useEffect(() => {
    if (!isWorkoutActive) {
      setWorkoutDate(getDateKey(new Date()));
    }
  }, [isWorkoutActive]);

  const startWorkout = (template = null) => {
    const selectedDate = new Date(workoutDate + 'T' + new Date().toTimeString().slice(0, 8));

    const workout = {
      id: generateId(),
      startTime: selectedDate.toISOString(),
      templateId: template?.id || null,
      templateName: template?.name || 'Custom Workout',
      exercises: [],
      unit: settings.defaultUnit
    };

    if (template) {
      workout.exercises = template.movements.map(movementId => {
        const lastData = getLastExerciseData(movementId, workoutHistory, settings.defaultUnit);
        return {
          movementId,
          plannedSets: Array.from({ length: lastData.sets }, () => ({
            weight: lastData.weight,
            reps: null,
            difficulty: 0
          }))
        };
      });
    }

    setCurrentWorkout(workout);
    setIsWorkoutActive(true);
    setShowTemplateSelector(false);
    workoutTimer.reset();
  };

  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);

  const endWorkout = () => {
    if (!currentWorkout) return;

    const completedWorkout = {
      ...currentWorkout,
      endTime: new Date().toISOString(),
      duration: workoutTimer.seconds,
      exercises: currentWorkout.exercises.map(ex => {
        // Interval exercises save differently
        if (ex.type === 'interval') {
          return {
            movementId: ex.movementId,
            type: 'interval',
            workDuration: ex.workDuration,
            restDuration: ex.restDuration,
            rounds: ex.rounds,
            blocks: ex.blocks || [{ difficulty: ex.difficulty || 0, totalTime: 0 }],
            isComplete: ex.isComplete || false,
            sets: []  // empty array for backward compatibility
          };
        }
        // Sets-based exercises (existing behavior)
        return {
          movementId: ex.movementId,
          unit: ex.unit || settings.defaultUnit,
          completionTime: ex.completionTime || null,
          sets: ex.plannedSets
            .filter(s => s.reps !== null && s.reps !== undefined && s.reps > 0)
            .map(s => ({
              id: generateId(),
              weight: s.weight,
              reps: s.reps,
              difficulty: s.difficulty || 0,
              restTime: s.restTime || null,
              unit: ex.unit || settings.defaultUnit,
              timestamp: new Date().toISOString()
            }))
        };
      })
    };

    // Check if there's any meaningful data: sets with reps OR completed interval exercises
    const hasData = completedWorkout.exercises.some(ex =>
      ex.type === 'interval' ? ex.isComplete : ex.sets.length > 0
    );

    if (hasData) {
      setCompletedWorkoutData(completedWorkout);
      setWorkoutNotes('');
      setShowWorkoutSummary(true);
    } else {
      setCurrentWorkout(null);
      setIsWorkoutActive(false);
      workoutTimer.reset();
    }
  };

  const saveAndCloseWorkout = () => {
    if (!completedWorkoutData) return;

    const workoutWithNotes = {
      ...completedWorkoutData,
      notes: workoutNotes.trim() || null
    };

    setWorkoutHistory([workoutWithNotes, ...workoutHistory]);
    setCompletedWorkoutData(null);
    setShowWorkoutSummary(false);
    setCurrentWorkout(null);
    setIsWorkoutActive(false);
    workoutTimer.reset();
  };

  const addExercise = () => {
    if (!newExercise.movementId) return;

    let exercise;

    if (newExercise.exerciseType === 'interval') {
      // Interval exercise — no weight, just timing config
      if (newExercise.workDuration < 5 || newExercise.rounds < 1) return;

      exercise = {
        movementId: newExercise.movementId,
        type: 'interval',
        workDuration: newExercise.workDuration,
        restDuration: newExercise.restDuration,
        rounds: newExercise.rounds,
        blocks: [],
        currentBlockDifficulty: 0,
        isComplete: false
      };
    } else {
      // Sets-based exercise (existing behavior)
      if (!newExercise.startingWeight || newExercise.plannedSets < 1) return;

      const exerciseUnit = newExercise.exerciseUnit || settings.defaultUnit;
      const weight = parseFloat(newExercise.startingWeight);
      let totalWeight = weight;

      if (newExercise.isOneSide) {
        if (newExercise.ignoreBarWeight) {
          totalWeight = weight * 2;
        } else {
          const barWeight = parseFloat(newExercise.barWeight) || DEFAULT_BAR_WEIGHT[exerciseUnit];
          totalWeight = (weight * 2) + barWeight;
        }
      }

      exercise = {
        movementId: newExercise.movementId,
        unit: exerciseUnit,
        plannedSets: Array.from({ length: newExercise.plannedSets }, () => ({
          weight: totalWeight,
          reps: null,
          difficulty: 0,
          isGo: false
        }))
      };
    }

    setCurrentWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));

    setNewExercise({
      movementId: '',
      plannedSets: DEFAULT_SETS,
      startingWeight: '',
      isOneSide: false,
      barWeight: '',
      ignoreBarWeight: false,
      exerciseUnit: null,
      exerciseType: 'sets',
      workDuration: DEFAULT_WORK_DURATION,
      restDuration: DEFAULT_REST_DURATION,
      rounds: DEFAULT_ROUNDS
    });
    setShowAddExercise(false);
  };

  const updateSet = (exerciseIndex, setIndex, updates) => {
    setCurrentWorkout(prev => {
      const newExercises = [...prev.exercises];
      const exercise = { ...newExercises[exerciseIndex] };
      const plannedSets = [...exercise.plannedSets];

      if (updates.isGo === true && setIndex > 0) {
        const prevSet = plannedSets[setIndex - 1];
        if (prevSet.repStartTime) {
          const restTime = Math.round((Date.now() - prevSet.repStartTime) / 1000);
          plannedSets[setIndex - 1] = { ...prevSet, restTime };
        }
      }

      plannedSets[setIndex] = { ...plannedSets[setIndex], ...updates };

      if (updates.repStartTime && !exercise.firstRepTime) {
        exercise.firstRepTime = updates.repStartTime;
      }

      exercise.plannedSets = plannedSets;
      newExercises[exerciseIndex] = exercise;

      return { ...prev, exercises: newExercises };
    });
  };

  const updateExercise = (exerciseIndex, updates) => {
    setCurrentWorkout(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], ...updates };
      return { ...prev, exercises: newExercises };
    });
  };

  const markExerciseComplete = (exerciseIndex, isComplete) => {
    setCurrentWorkout(prev => {
      const newExercises = [...prev.exercises];
      const exercise = newExercises[exerciseIndex];

      if (isComplete && exercise.firstRepTime) {
        const completionTime = Date.now() - exercise.firstRepTime;
        newExercises[exerciseIndex] = { ...exercise, isComplete: true, completionTime };
      } else {
        newExercises[exerciseIndex] = { ...exercise, isComplete, completionTime: null };
      }

      return { ...prev, exercises: newExercises };
    });
  };

  const addSetToExercise = (exerciseIndex, weight) => {
    setCurrentWorkout(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        plannedSets: [
          ...newExercises[exerciseIndex].plannedSets,
          { weight, reps: null, difficulty: 0 }
        ]
      };
      return { ...prev, exercises: newExercises };
    });
  };

  const removeSetFromExercise = (exerciseIndex) => {
    setCurrentWorkout(prev => {
      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        plannedSets: newExercises[exerciseIndex].plannedSets.slice(0, -1)
      };
      return { ...prev, exercises: newExercises };
    });
  };

  const removeExercise = (exerciseIndex) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exerciseIndex)
    }));
  };

  const getMovementName = (id) => movements.find(m => m.id === id)?.name || 'Unknown';

  const updateWorkoutInHistory = (updatedWorkout) => {
    setWorkoutHistory(prev =>
      prev.map(w => w.id === updatedWorkout.id ? updatedWorkout : w)
    );
    setViewingWorkout(updatedWorkout);
  };

  if (viewingWorkout) {
    return (
      <WorkoutDetailView
        workout={viewingWorkout}
        movements={movements}
        onBack={() => setViewingWorkout(null)}
        onUpdateWorkout={updateWorkoutInHistory}
      />
    );
  }

  if (showAllWorkouts) {
    return (
      <AllWorkoutsView
        workoutHistory={workoutHistory}
        movements={movements}
        onSelectWorkout={setViewingWorkout}
        onBack={() => setShowAllWorkouts(false)}
      />
    );
  }

  const isToday = workoutDate === getDateKey(new Date());
  const formattedSelectedDate = new Date(workoutDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: workoutDate.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined
  });

  if (!isWorkoutActive) {
    const recentWorkouts = workoutHistory.slice(0, 3);

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto">
              <Icons.Dumbbell />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Start a Workout</h3>
            <p className="text-gray-600 dark:text-gray-400">Begin tracking your sets and reps</p>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Date:</span>
              <button
                onClick={() => setShowDatePicker(true)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  isToday
                    ? 'bg-gray-50 dark:bg-navy-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icons.Calendar />
                  {isToday ? 'Today' : formattedSelectedDate}
                </span>
              </button>
              {!isToday && (
                <button
                  onClick={() => setWorkoutDate(getDateKey(new Date()))}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                >
                  Reset to today
                </button>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowTemplateSelector(true)}>
                Use Template
              </Button>
              <Button variant="secondary" onClick={() => startWorkout()}>
                Start Empty
              </Button>
            </div>
          </div>
        </Card>

        {recentWorkouts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Icons.History /> Recent Workouts
            </h3>
            {recentWorkouts.map(workout => (
              <WorkoutSummaryCard
                key={workout.id}
                workout={workout}
                movements={movements}
                onClick={() => setViewingWorkout(workout)}
              />
            ))}
            {workoutHistory.length > 3 && (
              <button
                onClick={() => setShowAllWorkouts(true)}
                className="w-full py-3 text-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                Show All ({workoutHistory.length} workouts)
              </button>
            )}
          </div>
        )}

        <Modal isOpen={showTemplateSelector} onClose={() => setShowTemplateSelector(false)} title="Select Template">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No templates available. Create one first!</p>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => startWorkout(template)}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-navy-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {template.movements.length} exercises
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>

        <Modal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} title="Select Workout Date">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a date to log a past workout. This is useful for entering workouts you forgot to track.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workout Date</label>
              <input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                max={getDateKey(new Date())}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-navy-900 dark:text-gray-100"
              />
            </div>
            {!isToday && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Backdating:</strong> This workout will be recorded for {formattedSelectedDate}.
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => {
                setWorkoutDate(getDateKey(new Date()));
                setShowDatePicker(false);
              }}>
                Reset to Today
              </Button>
              <Button onClick={() => setShowDatePicker(false)}>
                Confirm Date
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Active workout view
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{currentWorkout.templateName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isToday ? 'In progress' : (
                <span className="text-amber-600 dark:text-amber-400">
                  Logging for {formattedSelectedDate}
                </span>
              )}
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={endWorkout}>
            <Icons.Stop /> End Workout
          </Button>
        </div>

        <div className="flex gap-4 mt-4">
          <TimerDisplay label="Workout" time={workoutTimer.formatted} isRunning={true} />
        </div>
      </Card>

      <div className="space-y-4">
        {currentWorkout.exercises.map((exercise, exIndex) => (
          exercise.type === 'interval' ? (
            <IntervalTracker
              key={exIndex}
              exercise={exercise}
              movementName={getMovementName(exercise.movementId)}
              onUpdateExercise={(updates) => updateExercise(exIndex, updates)}
              onRemoveExercise={() => removeExercise(exIndex)}
            />
          ) : (
            <ExerciseTracker
              key={exIndex}
              exercise={exercise}
              movementName={getMovementName(exercise.movementId)}
              onUpdateSet={(setIndex, updates) => updateSet(exIndex, setIndex, updates)}
              onAddSet={(weight) => addSetToExercise(exIndex, weight)}
              onRemoveSet={() => removeSetFromExercise(exIndex)}
              onRemoveExercise={() => removeExercise(exIndex)}
              onUpdateExercise={(updates) => updateExercise(exIndex, updates)}
              onMarkComplete={(isComplete) => markExerciseComplete(exIndex, isComplete)}
              defaultUnit={settings.defaultUnit}
            />
          )
        ))}
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setShowAddExercise(true)}
      >
        <Icons.Plus /> Add Exercise
      </Button>

      <Modal isOpen={showAddExercise} onClose={() => setShowAddExercise(false)} title="Add Exercise">
        <div className="space-y-4">
          {/* Exercise type toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-navy-900 p-1">
            <button
              onClick={() => setNewExercise({ ...newExercise, exerciseType: 'sets' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                newExercise.exerciseType === 'sets'
                  ? 'bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icons.Dumbbell /> Sets
            </button>
            <button
              onClick={() => setNewExercise({ ...newExercise, exerciseType: 'interval' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                newExercise.exerciseType === 'interval'
                  ? 'bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icons.Interval /> Interval
            </button>
          </div>

          {/* Exercise selector (shared) */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exercise</label>
            <select
              value={newExercise.movementId}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  const name = prompt('Enter new exercise name:');
                  if (name && name.trim()) {
                    const newMovement = {
                      id: generateId(),
                      name: name.trim(),
                      bodyParts: []
                    };
                    setMovements(prev => [...prev, newMovement]);
                    setNewExercise({ ...newExercise, movementId: newMovement.id });
                  }
                } else {
                  setNewExercise({ ...newExercise, movementId: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-navy-900 dark:text-gray-100"
            >
              <option value="">Select an exercise...</option>
              {movements.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="__add_new__">+ Add new exercise...</option>
            </select>
          </div>

          {/* Sets-specific fields */}
          {newExercise.exerciseType === 'sets' && (
            <>
              {newExercise.movementId && (() => {
                const lastData = getLastExerciseMaxWeight(newExercise.movementId, workoutHistory);
                if (lastData) {
                  return (
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                      Last time: {lastData.weight} {lastData.unit} for {lastData.reps} reps
                    </div>
                  );
                }
                return null;
              })()}

              <NumberStepper
                label="Planned Sets"
                value={newExercise.plannedSets}
                onChange={(v) => setNewExercise({ ...newExercise, plannedSets: v })}
                min={1}
                max={20}
              />

              <WeightInputSetup
                value={newExercise.startingWeight}
                onChange={(v) => setNewExercise({ ...newExercise, startingWeight: v })}
                unit={newExercise.exerciseUnit || settings.defaultUnit}
                isOneSide={newExercise.isOneSide}
                onOneSideChange={(v) => setNewExercise({ ...newExercise, isOneSide: v })}
                barWeight={newExercise.barWeight}
                onBarWeightChange={(v) => setNewExercise({ ...newExercise, barWeight: v })}
                ignoreBarWeight={newExercise.ignoreBarWeight}
                onIgnoreBarWeightChange={(v) => setNewExercise({ ...newExercise, ignoreBarWeight: v })}
              />

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Weight unit:</span>
                <button
                  onClick={() => setNewExercise({
                    ...newExercise,
                    exerciseUnit: (newExercise.exerciseUnit || settings.defaultUnit) === 'lbs' ? 'kg' : 'lbs'
                  })}
                  className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {newExercise.exerciseUnit || settings.defaultUnit}
                </button>
              </div>
            </>
          )}

          {/* Interval-specific fields */}
          {newExercise.exerciseType === 'interval' && (
            <>
              <TimeStepper
                label="Work Duration"
                value={newExercise.workDuration}
                onChange={(v) => setNewExercise({ ...newExercise, workDuration: v })}
                min={5}
                max={600}
                step={5}
              />

              <TimeStepper
                label="Rest Duration"
                value={newExercise.restDuration}
                onChange={(v) => setNewExercise({ ...newExercise, restDuration: v })}
                min={0}
                max={300}
                step={5}
              />

              <NumberStepper
                label="Rounds"
                value={newExercise.rounds}
                onChange={(v) => setNewExercise({ ...newExercise, rounds: v })}
                min={1}
                max={50}
              />

              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-navy-900 rounded-lg px-3 py-2">
                Total time: {formatTime(
                  (newExercise.workDuration * newExercise.rounds) +
                  (newExercise.restDuration * Math.max(0, newExercise.rounds - 1))
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowAddExercise(false)}>Cancel</Button>
            <Button
              onClick={addExercise}
              disabled={
                !newExercise.movementId || (
                  newExercise.exerciseType === 'sets'
                    ? (!newExercise.startingWeight || newExercise.plannedSets < 1)
                    : (newExercise.workDuration < 5 || newExercise.rounds < 1)
                )
              }
            >
              Add Exercise
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showWorkoutSummary} onClose={() => {}} title="Workout Complete!" size="lg">
        {completedWorkoutData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
              <Icons.Timer />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(completedWorkoutData.duration)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Duration</div>
              </div>
              {completedWorkoutData.duration < 1800 && (
                <span className="ml-auto text-yellow-500" title="Quick workout!">
                  <Icons.Lightning />
                </span>
              )}
            </div>

            {(() => {
              const currentVolume = calculateWorkoutVolume(completedWorkoutData);
              const previousWorkout = workoutHistory[0];
              const previousVolume = previousWorkout ? calculateWorkoutVolume(previousWorkout) : 0;
              const volumeChange = previousVolume > 0
                ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100)
                : null;

              return (
                <div className="bg-gray-50 dark:bg-navy-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {currentVolume.toLocaleString()} lbs
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Volume</div>
                    </div>
                    {volumeChange !== null && (
                      <div className={`text-lg font-semibold ${
                        volumeChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {volumeChange >= 0 ? '+' : ''}{volumeChange}%
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">vs last workout</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="text-sm text-gray-600 dark:text-gray-400">
              {(() => {
                const setsExercises = completedWorkoutData.exercises.filter(ex => ex.type !== 'interval' && ex.sets.length > 0);
                const intervalExercises = completedWorkoutData.exercises.filter(ex => ex.type === 'interval' && ex.isComplete);
                const totalSets = setsExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
                const parts = [];
                if (setsExercises.length > 0) parts.push(`${setsExercises.length} exercise${setsExercises.length !== 1 ? 's' : ''}, ${totalSets} sets`);
                if (intervalExercises.length > 0) {
                  const totalBlocks = intervalExercises.reduce((sum, ex) => sum + (ex.blocks ? ex.blocks.length : 1), 0);
                  parts.push(totalBlocks > intervalExercises.length
                    ? `${totalBlocks} interval blocks`
                    : `${intervalExercises.length} interval${intervalExercises.length !== 1 ? 's' : ''}`
                  );
                }
                return parts.join(', ') || 'No exercises completed';
              })()}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-navy-900 dark:text-gray-100"
                rows={3}
                placeholder="How did the workout feel? Any PRs or notes..."
              />
            </div>

            <Button onClick={saveAndCloseWorkout} className="w-full">
              Save & Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActiveWorkout;
