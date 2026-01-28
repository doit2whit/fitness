import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const DIFFICULTY_LEVELS = [
  { value: 0, label: 'None', color: '#e5e7eb', textColor: '#6b7280' },
  { value: 1, label: 'Very Easy', color: '#1e40af', textColor: '#ffffff' },
  { value: 2, label: 'Easy', color: '#60a5fa', textColor: '#ffffff' },
  { value: 3, label: 'Moderate', color: '#f97316', textColor: '#ffffff' },
  { value: 4, label: 'Hard', color: '#fca5a5', textColor: '#991b1b' },
  { value: 5, label: 'Very Hard', color: '#dc2626', textColor: '#ffffff' }
];

const DEFAULT_BODY_PARTS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Glutes'
];

const DEFAULT_MOVEMENTS = [
  { id: '1', name: 'Bench Press', bodyParts: ['Chest', 'Triceps'] },
  { id: '2', name: 'Squat', bodyParts: ['Legs', 'Glutes', 'Core'] },
  { id: '3', name: 'Deadlift', bodyParts: ['Back', 'Legs', 'Core'] },
  { id: '4', name: 'Overhead Press', bodyParts: ['Shoulders', 'Triceps'] },
  { id: '5', name: 'Barbell Row', bodyParts: ['Back', 'Biceps'] },
  { id: '6', name: 'Pull-ups', bodyParts: ['Back', 'Biceps'] },
  { id: '7', name: 'Dumbbell Curl', bodyParts: ['Biceps'] },
  { id: '8', name: 'Tricep Pushdown', bodyParts: ['Triceps'] },
  { id: '9', name: 'Leg Press', bodyParts: ['Legs', 'Glutes'] },
  { id: '10', name: 'Lat Pulldown', bodyParts: ['Back', 'Biceps'] }
];

const DEFAULT_BAR_WEIGHT = { lbs: 45, kg: 20 };
const DEFAULT_SETS = 5;
const DEFAULT_WEIGHT = 1;

const STORAGE_KEYS = {
  movements: 'fitness_movements',
  bodyParts: 'fitness_bodyParts',
  workoutHistory: 'fitness_workoutHistory',
  workoutTemplates: 'fitness_workoutTemplates',
  settings: 'fitness_settings',
  lastBackupCount: 'fitness_lastBackupCount'
};

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Local storage utilities
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

// Calculate average difficulty for a workout
const getWorkoutAvgDifficulty = (workout) => {
  let totalDifficulty = 0;
  let setCount = 0;
  workout.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.difficulty > 0) {
        totalDifficulty += set.difficulty;
        setCount++;
      }
    });
  });
  return setCount > 0 ? totalDifficulty / setCount : 0;
};

// Get difficulty label and color
const getDifficultyInfo = (avgDifficulty) => {
  if (avgDifficulty === 0) return { label: 'N/A', color: '#9ca3af' };
  if (avgDifficulty <= 1.5) return { label: 'Very Easy', color: '#1e40af' };
  if (avgDifficulty <= 2.5) return { label: 'Easy', color: '#60a5fa' };
  if (avgDifficulty <= 3.5) return { label: 'Moderate', color: '#f97316' };
  if (avgDifficulty <= 4.5) return { label: 'Hard', color: '#fca5a5' };
  return { label: 'Very Hard', color: '#dc2626' };
};

// Get last performed exercise data from workout history
const getLastExerciseData = (movementId, workoutHistory, defaultUnit) => {
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

// Get max weight and reps from last workout containing this movement (for reminder display)
const getLastExerciseMaxWeight = (movementId, workoutHistory) => {
  for (const workout of workoutHistory) {
    const exercise = workout.exercises.find(ex => ex.movementId === movementId);
    if (exercise && exercise.sets.length > 0) {
      // Find the set with maximum weight
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

// Calculate total volume for a workout (weight × reps for all sets)
const calculateWorkoutVolume = (workout) => {
  let total = 0;
  workout.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.reps !== null && set.reps !== undefined) {
        total += set.weight * set.reps;
      }
    });
  });
  return total;
};

// Convert kg to lbs
const kgToLbs = (kg) => Math.round(kg * 2.20462);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => loadFromStorage(key, defaultValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
};

const useTimer = (isRunning) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, reset, formatted: formatTime(seconds) };
};

// Long press hook
const useLongPress = (callback, ms = 3000) => {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      callbackRef.current();
    }, ms);
  }, [ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop
  };
};

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Timer: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Dumbbell: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h2v8H4V8zm14 0h2v8h-2V8zM7 10h10v4H7v-4zM2 10h2v4H2v-4zm18 0h2v4h-2v-4z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Stop: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronUp: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  History: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Lightning: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <input
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
    />
  </div>
);

const Select = ({ label, options, value, onChange, className = '' }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${className}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-xl ${sizes[size]} w-full mx-auto p-6 transform transition-all`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icons.X />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-auto p-6 transform transition-all">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" onClick={onConfirm}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200">
    <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  </div>
);

// Number Stepper with Large Arrows
const NumberStepper = ({ value, onChange, min = 1, max = 20, label }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        disabled={value <= min}
      >
        <Icons.ChevronDown />
      </button>
      <div className="w-16 text-center text-2xl font-bold text-gray-900">
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        disabled={value >= max}
      >
        <Icons.ChevronUp />
      </button>
    </div>
  </div>
);

// ============================================================================
// FEATURE COMPONENTS
// ============================================================================

// Timer Display Component
const TimerDisplay = ({ label, time, isRunning, onReset }) => (
  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
    <Icons.Timer />
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-mono font-bold ${isRunning ? 'text-indigo-600' : 'text-gray-900'}`}>
        {time}
      </div>
    </div>
    {onReset && (
      <button onClick={onReset} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">
        Reset
      </button>
    )}
  </div>
);

// Set Circle Component with GO state and rest timer
const SetCircle = ({
  setIndex,
  weight,
  reps,
  difficulty,
  restTime,
  isGo,
  onWeightClick,
  onCircleClick,
  onCircleLongPress,
  onDifficultyClick,
  unit
}) => {
  const longPressHandlers = useLongPress(onCircleLongPress, 3000);
  const difficultyLevel = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS[0];

  const hasReps = reps !== null && reps !== undefined && reps > 0;
  const showGo = isGo && !hasReps;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Rest time display above circle */}
      <div className="h-5 text-xs text-gray-400 font-mono">
        {restTime !== null && restTime !== undefined ? formatTime(restTime) : ''}
      </div>

      <button
        onClick={onWeightClick}
        className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
      >
        {weight} {unit}
      </button>

      <button
        onClick={onCircleClick}
        {...longPressHandlers}
        className={`w-14 h-14 rounded-full border-3 flex items-center justify-center text-lg font-bold transition-all select-none ${
          showGo
            ? 'bg-green-100 border-green-400 text-green-700'
            : hasReps
              ? 'bg-blue-100 border-blue-400 text-blue-700'
              : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
        }`}
        style={{ borderWidth: '3px' }}
      >
        {showGo ? 'GO' : hasReps ? reps : ''}
      </button>

      <span className="text-xs text-gray-500">Set {setIndex + 1}</span>

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

// Exercise Tracker Component with GO state, rest timers, completion tracking, and unit selection
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

  // Exercise-level unit (defaults to defaultUnit if not set)
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
      // Empty -> GO state
      onUpdateSet(index, { isGo: true, reps: null });
    } else if (isCurrentlyGo && (currentReps === null || currentReps === undefined || currentReps === 0)) {
      // GO -> 1 rep (starts the timer for this set, stops timer for previous set)
      onUpdateSet(index, { isGo: false, reps: 1, repStartTime: Date.now() });
    } else {
      // Increment reps
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

  // Get the last set's weight for adding new sets
  const lastSetWeight = exercise.plannedSets.length > 0
    ? exercise.plannedSets[exercise.plannedSets.length - 1].weight
    : 0;

  return (
    <>
      <Card className={`p-4 ${exercise.isComplete ? 'bg-green-50 border-green-200' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{movementName}</h4>
            {/* Unit toggle button */}
            <button
              onClick={handleUnitToggle}
              className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Toggle unit"
            >
              {exerciseUnit}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Complete button */}
            <button
              onClick={handleToggleComplete}
              className={`p-1.5 rounded transition-colors ${
                exercise.isComplete
                  ? 'text-green-600 bg-green-100 hover:bg-green-200'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              title={exercise.isComplete ? 'Mark incomplete' : 'Mark complete'}
            >
              <Icons.CheckCircle />
            </button>
            <button
              onClick={onRemoveExercise}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icons.Trash />
            </button>
          </div>
        </div>

        {exercise.isComplete && exercise.completionTime && (
          <div className="text-sm text-green-600 mb-3">
            Completed in {formatTime(Math.round(exercise.completionTime / 1000))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Up/Down arrows on the left */}
          <div className="flex flex-col gap-1 mr-2">
            <button
              onClick={() => onAddSet(lastSetWeight)}
              className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
              title="Add set"
            >
              <Icons.ChevronUp />
            </button>
            <button
              onClick={handleRemoveSetClick}
              className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              title="Remove set"
            >
              <Icons.ChevronDown />
            </button>
          </div>

          {/* Sets circles */}
          <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
            {exercise.plannedSets.map((set, index) => (
              <div key={index} className="flex-shrink-0">
                {editingWeightIndex === index ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5" /> {/* Spacer for rest time */}
                    <input
                      type="number"
                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                      onBlur={() => handleWeightSave(index)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWeightSave(index)}
                      className="w-16 px-2 py-1 text-sm text-center border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <div className="w-14 h-14" />
                    <span className="text-xs text-gray-500">Set {index + 1}</span>
                    <div className="w-14 h-6" />
                  </div>
                ) : (
                  <SetCircle
                    setIndex={index}
                    weight={set.weight}
                    reps={set.reps}
                    difficulty={set.difficulty || 0}
                    restTime={set.restTime}
                    isGo={set.isGo}
                    onWeightClick={() => handleWeightClick(index)}
                    onCircleClick={() => handleCircleClick(index)}
                    onCircleLongPress={() => handleCircleLongPress(index)}
                    onDifficultyClick={() => handleDifficultyClick(index)}
                    unit={exerciseUnit}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
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

// Workout Summary Card Component
const WorkoutSummaryCard = ({ workout, movements, onClick }) => {
  const avgDifficulty = getWorkoutAvgDifficulty(workout);
  const difficultyInfo = getDifficultyInfo(avgDifficulty);
  const totalSets = workout.exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.reps !== null && s.reps !== undefined).length, 0
  );
  const isQuickWorkout = workout.duration && workout.duration < 1800; // Less than 30 minutes

  const exerciseNames = workout.exercises
    .map(ex => movements.find(m => m.id === ex.movementId)?.name || 'Unknown')
    .slice(0, 3);

  const moreCount = workout.exercises.length - 3;

  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{workout.templateName}</h4>
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: difficultyInfo.color }}
            >
              {difficultyInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
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
            <span className="text-lg font-semibold text-gray-900">{totalSets}</span>
            {isQuickWorkout && (
              <span className="text-yellow-500" title="Quick workout (under 30 min)">
                <Icons.Lightning />
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">sets</div>
        </div>
      </div>
    </Card>
  );
};

// Workout Detail View Component
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
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icons.Back /> Back
      </button>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900">{workout.templateName}</h3>
              {isQuickWorkout && (
                <span className="text-yellow-500" title="Quick workout (under 30 min)">
                  <Icons.Lightning />
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
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
          <div className="mt-3 flex items-center gap-2 text-gray-600">
            <Icons.Timer />
            <span>Duration: {formatTime(workout.duration)}</span>
          </div>
        )}

        {/* Notes section */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Notes</span>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <p className="text-gray-600 text-sm">
              {workout.notes || <span className="text-gray-400 italic">No notes</span>}
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {workout.exercises.map((exercise, exIndex) => {
          const completedSets = exercise.sets.filter(s => s.reps !== null && s.reps !== undefined);
          if (completedSets.length === 0) return null;

          return (
            <Card key={exIndex} className="p-4">
              <div className="flex items-center justify-between mb-3">
                {editingExerciseIndex === exIndex ? (
                  <select
                    value={exercise.movementId}
                    onChange={(e) => handleChangeMovement(exIndex, e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  >
                    {movements.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <h4 className="font-medium text-gray-900">{getMovementName(exercise.movementId)}</h4>
                    <button
                      onClick={() => setEditingExerciseIndex(exIndex)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Change exercise"
                    >
                      <Icons.Edit />
                    </button>
                  </>
                )}
              </div>
              {exercise.completionTime && (
                <div className="text-xs text-gray-500 mb-2">
                  Completed in {formatTime(exercise.completionTime)}
                </div>
              )}
              <div className="space-y-2">
                {completedSets.map((set, setIndex) => {
                  const diffLevel = DIFFICULTY_LEVELS[set.difficulty] || DIFFICULTY_LEVELS[0];
                  return (
                    <div key={setIndex} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-500 w-12">Set {setIndex + 1}</span>
                        <span className="font-medium">{set.weight} {set.unit || workout.unit}</span>
                        <span className="text-gray-600">× {set.reps} reps</span>
                        {set.restTime && (
                          <span className="text-xs text-gray-400">
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

// All Workouts List View
const AllWorkoutsView = ({ workoutHistory, movements, onSelectWorkout, onBack }) => {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icons.Back /> Back
      </button>

      <h3 className="text-lg font-semibold text-gray-900">All Workouts</h3>

      {workoutHistory.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">No workouts recorded yet</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {workoutHistory.map(workout => (
            <WorkoutSummaryCard
              key={workout.id}
              workout={workout}
              movements={movements}
              onClick={() => onSelectWorkout(workout)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Weight Input Component for setup - Updated with ignore bar weight option
const WeightInputSetup = ({ value, onChange, unit, isOneSide, onOneSideChange, barWeight, onBarWeightChange, ignoreBarWeight, onIgnoreBarWeightChange }) => {
  const calculatedTotal = useMemo(() => {
    if (!isOneSide || !value) return value;
    const sideWeight = parseFloat(value) || 0;
    if (ignoreBarWeight) {
      return sideWeight * 2;
    }
    const bar = parseFloat(barWeight) || DEFAULT_BAR_WEIGHT[unit];
    return (sideWeight * 2) + bar;
  }, [value, isOneSide, barWeight, unit, ignoreBarWeight]);

  return (
    <div className="space-y-3">
      <Input
        label="Starting Weight"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isOneSide ? "Weight per side" : "Total weight"}
        min="0"
        step="2.5"
      />

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isOneSide}
            onChange={(e) => onOneSideChange(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">One-side entry</span>
        </label>

        {isOneSide && (
          <>
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={ignoreBarWeight}
                onChange={(e) => onIgnoreBarWeightChange(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Ignore bar weight</span>
            </label>

            {!ignoreBarWeight && (
              <div className="flex items-center gap-2 ml-6">
                <span className="text-sm text-gray-500">Bar:</span>
                <input
                  type="number"
                  value={barWeight}
                  onChange={(e) => onBarWeightChange(e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder={DEFAULT_BAR_WEIGHT[unit]}
                />
                <span className="text-sm text-gray-500">{unit}</span>
              </div>
            )}
          </>
        )}
      </div>

      {isOneSide && value && (
        <div className="text-sm text-indigo-600 font-medium">
          Total: {calculatedTotal} {unit}
        </div>
      )}
    </div>
  );
};

// Movement Manager Component
const MovementManager = ({ movements, setMovements, bodyParts, setBodyParts }) => {
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showAddBodyPart, setShowAddBodyPart] = useState(false);
  const [newMovement, setNewMovement] = useState({ name: '', bodyParts: [] });
  const [newBodyPart, setNewBodyPart] = useState('');
  const [editingMovement, setEditingMovement] = useState(null);

  const handleAddMovement = () => {
    if (!newMovement.name.trim()) return;
    const movement = {
      id: generateId(),
      name: newMovement.name.trim(),
      bodyParts: newMovement.bodyParts
    };
    setMovements([...movements, movement]);
    setNewMovement({ name: '', bodyParts: [] });
    setShowAddMovement(false);
  };

  const handleUpdateMovement = () => {
    if (!editingMovement?.name.trim()) return;
    setMovements(movements.map(m => m.id === editingMovement.id ? editingMovement : m));
    setEditingMovement(null);
  };

  const handleDeleteMovement = (id) => {
    setMovements(movements.filter(m => m.id !== id));
  };

  const handleAddBodyPart = () => {
    if (!newBodyPart.trim() || bodyParts.includes(newBodyPart.trim())) return;
    setBodyParts([...bodyParts, newBodyPart.trim()]);
    setNewBodyPart('');
    setShowAddBodyPart(false);
  };

  const handleDeleteBodyPart = (part) => {
    setBodyParts(bodyParts.filter(p => p !== part));
    setMovements(movements.map(m => ({
      ...m,
      bodyParts: m.bodyParts.filter(bp => bp !== part)
    })));
  };

  const toggleBodyPart = (part, isNew = false) => {
    if (isNew) {
      const current = newMovement.bodyParts;
      setNewMovement({
        ...newMovement,
        bodyParts: current.includes(part)
          ? current.filter(p => p !== part)
          : [...current, part]
      });
    } else if (editingMovement) {
      const current = editingMovement.bodyParts;
      setEditingMovement({
        ...editingMovement,
        bodyParts: current.includes(part)
          ? current.filter(p => p !== part)
          : [...current, part]
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Body Parts</h3>
          <Button size="sm" onClick={() => setShowAddBodyPart(true)}>
            <Icons.Plus /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {bodyParts.map(part => (
            <div key={part} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
              <span className="text-sm">{part}</span>
              <button
                onClick={() => handleDeleteBodyPart(part)}
                className="text-gray-400 hover:text-red-500 ml-1"
              >
                <Icons.X />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Movements</h3>
          <Button size="sm" onClick={() => setShowAddMovement(true)}>
            <Icons.Plus /> Add Movement
          </Button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {movements.map(movement => (
            <div
              key={movement.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <div className="font-medium text-gray-900">{movement.name}</div>
                <div className="flex gap-1 mt-1">
                  {movement.bodyParts.map(part => (
                    <Badge key={part} color="indigo">{part}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingMovement(movement)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <Icons.Edit />
                </button>
                <button
                  onClick={() => handleDeleteMovement(movement.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={showAddBodyPart} onClose={() => setShowAddBodyPart(false)} title="Add Body Part">
        <div className="space-y-4">
          <Input
            label="Body Part Name"
            value={newBodyPart}
            onChange={(e) => setNewBodyPart(e.target.value)}
            placeholder="e.g., Forearms"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowAddBodyPart(false)}>Cancel</Button>
            <Button onClick={handleAddBodyPart}>Add</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddMovement} onClose={() => setShowAddMovement(false)} title="Add Movement">
        <div className="space-y-4">
          <Input
            label="Movement Name"
            value={newMovement.name}
            onChange={(e) => setNewMovement({ ...newMovement, name: e.target.value })}
            placeholder="e.g., Incline Dumbbell Press"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Body Parts</label>
            <div className="flex flex-wrap gap-2">
              {bodyParts.map(part => (
                <button
                  key={part}
                  onClick={() => toggleBodyPart(part, true)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    newMovement.bodyParts.includes(part)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowAddMovement(false)}>Cancel</Button>
            <Button onClick={handleAddMovement}>Add Movement</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingMovement} onClose={() => setEditingMovement(null)} title="Edit Movement">
        {editingMovement && (
          <div className="space-y-4">
            <Input
              label="Movement Name"
              value={editingMovement.name}
              onChange={(e) => setEditingMovement({ ...editingMovement, name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Body Parts</label>
              <div className="flex flex-wrap gap-2">
                {bodyParts.map(part => (
                  <button
                    key={part}
                    onClick={() => toggleBodyPart(part, false)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      editingMovement.bodyParts.includes(part)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditingMovement(null)}>Cancel</Button>
              <Button onClick={handleUpdateMovement}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Workout Templates Component
const WorkoutTemplates = ({ templates, setTemplates, movements }) => {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', movements: [] });
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || newTemplate.movements.length === 0) return;
    const template = {
      id: generateId(),
      name: newTemplate.name.trim(),
      movements: newTemplate.movements
    };
    setTemplates([...templates, template]);
    setNewTemplate({ name: '', movements: [] });
    setShowCreateTemplate(false);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate?.name.trim()) return;
    setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const toggleMovement = (movementId, isNew = false) => {
    if (isNew) {
      const current = newTemplate.movements;
      setNewTemplate({
        ...newTemplate,
        movements: current.includes(movementId)
          ? current.filter(m => m !== movementId)
          : [...current, movementId]
      });
    } else if (editingTemplate) {
      const current = editingTemplate.movements;
      setEditingTemplate({
        ...editingTemplate,
        movements: current.includes(movementId)
          ? current.filter(m => m !== movementId)
          : [...current, movementId]
      });
    }
  };

  const getMovementName = (id) => movements.find(m => m.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Workout Templates</h3>
        <Button size="sm" onClick={() => setShowCreateTemplate(true)}>
          <Icons.Plus /> Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates yet. Create one to quickly start workouts!
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(template => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.movements.map(movementId => (
                      <Badge key={movementId} color="blue">
                        {getMovementName(movementId)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-gray-400 hover:text-indigo-600"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateTemplate} onClose={() => setShowCreateTemplate(false)} title="Create Workout Template">
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            placeholder="e.g., Push Day, Leg Day"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Movements</label>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {movements.map(movement => (
                <button
                  key={movement.id}
                  onClick={() => toggleMovement(movement.id, true)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    newTemplate.movements.includes(movement.id)
                      ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {movement.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateTemplate(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name.trim() || newTemplate.movements.length === 0}>
              Create Template
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)} title="Edit Workout Template">
        {editingTemplate && (
          <div className="space-y-4">
            <Input
              label="Template Name"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Movements</label>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {movements.map(movement => (
                  <button
                    key={movement.id}
                    onClick={() => toggleMovement(movement.id, false)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      editingTemplate.movements.includes(movement.id)
                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    {movement.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button onClick={handleUpdateTemplate}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Active Workout Component
const ActiveWorkout = ({ movements, setMovements, templates, workoutHistory, setWorkoutHistory, settings }) => {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState(null);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);

  // Workout date state for backdating
  const [workoutDate, setWorkoutDate] = useState(() => getDateKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New exercise setup state - updated with default 5 sets and ignore bar weight
  const [newExercise, setNewExercise] = useState({
    movementId: '',
    plannedSets: DEFAULT_SETS,
    startingWeight: '',
    isOneSide: false,
    barWeight: '',
    ignoreBarWeight: false,
    exerciseUnit: null
  });

  const workoutTimer = useTimer(isWorkoutActive);

  // Reset workout date to today when not in active workout
  useEffect(() => {
    if (!isWorkoutActive) {
      setWorkoutDate(getDateKey(new Date()));
    }
  }, [isWorkoutActive]);

  // Start workout with template - auto-populate exercises with last used data
  const startWorkout = (template = null) => {
    // Use selected date with current time for the timestamp
    const selectedDate = new Date(workoutDate + 'T' + new Date().toTimeString().slice(0, 8));

    const workout = {
      id: generateId(),
      startTime: selectedDate.toISOString(),
      templateId: template?.id || null,
      templateName: template?.name || 'Custom Workout',
      exercises: [],
      unit: settings.defaultUnit
    };

    // If using a template, auto-populate exercises with last used weight/sets
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

  // Workout summary state
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);

  const endWorkout = () => {
    if (!currentWorkout) return;

    const completedWorkout = {
      ...currentWorkout,
      endTime: new Date().toISOString(),
      duration: workoutTimer.seconds,
      exercises: currentWorkout.exercises.map(ex => ({
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
      }))
    };

    if (completedWorkout.exercises.some(ex => ex.sets.length > 0)) {
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
    if (!newExercise.movementId || !newExercise.startingWeight || newExercise.plannedSets < 1) return;

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

    const exercise = {
      movementId: newExercise.movementId,
      unit: exerciseUnit,
      plannedSets: Array.from({ length: newExercise.plannedSets }, () => ({
        weight: totalWeight,
        reps: null,
        difficulty: 0,
        isGo: false
      }))
    };

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
      exerciseUnit: null
    });
    setShowAddExercise(false);
  };

  const updateSet = (exerciseIndex, setIndex, updates) => {
    setCurrentWorkout(prev => {
      const newExercises = [...prev.exercises];
      const exercise = { ...newExercises[exerciseIndex] };
      const plannedSets = [...exercise.plannedSets];

      // If setting isGo to true on a set, record the rest time for the previous set
      if (updates.isGo === true && setIndex > 0) {
        const prevSet = plannedSets[setIndex - 1];
        if (prevSet.repStartTime) {
          const restTime = Math.round((Date.now() - prevSet.repStartTime) / 1000);
          plannedSets[setIndex - 1] = { ...prevSet, restTime };
        }
      }

      // Update the set
      plannedSets[setIndex] = { ...plannedSets[setIndex], ...updates };

      // Update the exercise's first rep time if this is the first set getting reps
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

  // Show workout detail view
  // Function to update a workout in history
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

  // Show all workouts list
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

  // Check if selected date is today
  const isToday = workoutDate === getDateKey(new Date());
  const formattedSelectedDate = new Date(workoutDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: workoutDate.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined
  });

  // Not in active workout
  if (!isWorkoutActive) {
    const recentWorkouts = workoutHistory.slice(0, 3);

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Icons.Dumbbell />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Start a Workout</h3>
            <p className="text-gray-600">Begin tracking your sets and reps</p>

            {/* Date picker for backdating */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">Date:</span>
              <button
                onClick={() => setShowDatePicker(true)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  isToday
                    ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
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
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
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
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
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
                className="w-full py-3 text-center text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Show All ({workoutHistory.length} workouts)
              </button>
            )}
          </div>
        )}

        <Modal isOpen={showTemplateSelector} onClose={() => setShowTemplateSelector(false)} title="Select Template">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No templates available. Create one first!</p>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => startWorkout(template)}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {template.movements.length} exercises
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>

        <Modal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} title="Select Workout Date">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a date to log a past workout. This is useful for entering workouts you forgot to track.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Workout Date</label>
              <input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                max={getDateKey(new Date())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {!isToday && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
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
            <h3 className="font-semibold text-gray-900">{currentWorkout.templateName}</h3>
            <p className="text-sm text-gray-500">
              {isToday ? 'In progress' : (
                <span className="text-amber-600">
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
          {/* Exercise selection with "Add new" option */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Exercise</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Select an exercise...</option>
              {movements.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              <option value="__add_new__">+ Add new exercise...</option>
            </select>
          </div>

          {/* Last weight reminder */}
          {newExercise.movementId && (() => {
            const lastData = getLastExerciseMaxWeight(newExercise.movementId, workoutHistory);
            if (lastData) {
              return (
                <div className="text-sm text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
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

          {/* Unit toggle for this exercise */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Weight unit:</span>
            <button
              onClick={() => setNewExercise({
                ...newExercise,
                exerciseUnit: (newExercise.exerciseUnit || settings.defaultUnit) === 'lbs' ? 'kg' : 'lbs'
              })}
              className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              {newExercise.exerciseUnit || settings.defaultUnit}
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowAddExercise(false)}>Cancel</Button>
            <Button
              onClick={addExercise}
              disabled={!newExercise.movementId || !newExercise.startingWeight || newExercise.plannedSets < 1}
            >
              Add Exercise
            </Button>
          </div>
        </div>
      </Modal>

      {/* Workout Summary Modal */}
      <Modal isOpen={showWorkoutSummary} onClose={() => {}} title="Workout Complete!" size="lg">
        {completedWorkoutData && (
          <div className="space-y-4">
            {/* Duration */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
              <Icons.Timer />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(completedWorkoutData.duration)}
                </div>
                <div className="text-sm text-gray-500">Total Duration</div>
              </div>
              {completedWorkoutData.duration < 1800 && (
                <span className="ml-auto text-yellow-500" title="Quick workout!">
                  <Icons.Lightning />
                </span>
              )}
            </div>

            {/* Volume */}
            {(() => {
              const currentVolume = calculateWorkoutVolume(completedWorkoutData);
              const previousWorkout = workoutHistory[0];
              const previousVolume = previousWorkout ? calculateWorkoutVolume(previousWorkout) : 0;
              const volumeChange = previousVolume > 0
                ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100)
                : null;

              return (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentVolume.toLocaleString()} lbs
                      </div>
                      <div className="text-sm text-gray-500">Total Volume</div>
                    </div>
                    {volumeChange !== null && (
                      <div className={`text-lg font-semibold ${
                        volumeChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {volumeChange >= 0 ? '+' : ''}{volumeChange}%
                        <div className="text-xs text-gray-500 font-normal">vs last workout</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Exercises summary */}
            <div className="text-sm text-gray-600">
              {completedWorkoutData.exercises.filter(ex => ex.sets.length > 0).length} exercises,{' '}
              {completedWorkoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets completed
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

// Trends Component
const TrendsView = ({ workoutHistory, movements, settings }) => {
  const [selectedMovement, setSelectedMovement] = useState('');

  const chartData = useMemo(() => {
    if (!selectedMovement) return [];

    const data = [];

    workoutHistory.forEach(workout => {
      const exercise = workout.exercises.find(ex => ex.movementId === selectedMovement);
      if (exercise && exercise.sets.length > 0) {
        // Convert all weights to lbs for consistent display
        const exerciseUnit = exercise.unit || workout.unit || 'lbs';

        const weights = exercise.sets.map(s => {
          const setUnit = s.unit || exerciseUnit;
          return setUnit === 'kg' ? kgToLbs(s.weight) : s.weight;
        });

        const maxWeight = Math.max(...weights);

        const totalVolume = exercise.sets.reduce((sum, s) => {
          const setUnit = s.unit || exerciseUnit;
          const weightInLbs = setUnit === 'kg' ? kgToLbs(s.weight) : s.weight;
          return sum + (weightInLbs * s.reps);
        }, 0);

        data.push({
          date: new Date(workout.startTime).toLocaleDateString(),
          maxWeight,
          totalVolume,
          sets: exercise.sets.length,
          totalReps: exercise.sets.reduce((sum, s) => sum + s.reps, 0)
        });
      }
    });

    return data.reverse();
  }, [workoutHistory, selectedMovement]);

  const movementsWithHistory = useMemo(() => {
    const movementIds = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(ex => {
        if (ex.sets.length > 0) movementIds.add(ex.movementId);
      });
    });
    return movements.filter(m => movementIds.has(m.id));
  }, [workoutHistory, movements]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <Select
          label="Select Exercise"
          value={selectedMovement}
          onChange={(e) => setSelectedMovement(e.target.value)}
          options={[
            { value: '', label: 'Choose an exercise to view trends...' },
            ...movementsWithHistory.map(m => ({ value: m.id, label: m.name }))
          ]}
        />
      </Card>

      {selectedMovement && chartData.length > 0 ? (
        <>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Max Weight Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    name="Max Weight (lbs)"
                    dot={{ fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Total Volume Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalVolume"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Total Volume (lbs × reps)"
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
            <div className="space-y-2">
              {chartData.slice(-5).reverse().map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{session.date}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Max: {session.maxWeight} lbs</span>
                    <span>{session.sets} sets</span>
                    <span>{session.totalReps} total reps</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : selectedMovement ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            No workout data available for this exercise yet.
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            Select an exercise to view your progress trends.
          </div>
        </Card>
      )}
    </div>
  );
};

// Calendar Component
const CalendarView = ({ workoutHistory }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const workoutsByDate = useMemo(() => {
    const map = {};
    workoutHistory.forEach(workout => {
      const dateKey = getDateKey(workout.startTime);
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(workout);
    });
    return map;
  }, [workoutHistory]);

  const getDayColor = (dateKey) => {
    const workouts = workoutsByDate[dateKey];
    if (!workouts || workouts.length === 0) return null;

    let totalDifficulty = 0;
    let setCount = 0;

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.difficulty > 0) {
            totalDifficulty += set.difficulty;
            setCount++;
          }
        });
      });
    });

    if (setCount === 0) return 'bg-gray-200';

    const avgDifficulty = totalDifficulty / setCount;

    if (avgDifficulty <= 2) return 'bg-blue-400 text-white';
    if (avgDifficulty <= 3.5) return 'bg-orange-400 text-white';
    return 'bg-red-500 text-white';
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getMonthDays();
  const today = getDateKey(new Date());

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.ChevronLeft />
          </button>
          <h3 className="font-semibold text-lg text-gray-900">{monthName}</h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}

          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = getDateKey(date);
            const color = getDayColor(dateKey);
            const isToday = dateKey === today;
            const workouts = workoutsByDate[dateKey];

            return (
              <div
                key={dateKey}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  color || 'hover:bg-gray-100'
                } ${isToday && !color ? 'ring-2 ring-indigo-500' : ''}`}
                title={workouts ? `${workouts.length} workout(s)` : ''}
              >
                <span className={isToday && !color ? 'font-bold text-indigo-600' : ''}>
                  {date.getDate()}
                </span>
                {workouts && (
                  <div className="w-1.5 h-1.5 rounded-full bg-current mt-0.5 opacity-75" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-400" />
            <span className="text-sm text-gray-600">Easy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400" />
            <span className="text-sm text-gray-600">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-gray-600">Hard</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Settings Component
const SettingsView = ({ settings, setSettings, workoutHistory, movements, bodyParts, templates }) => {
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExportJSON = () => {
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings,
      movements,
      bodyParts,
      templates,
      workoutHistory
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-backup-${getDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const handleExportCSV = () => {
    // Build CSV with one row per set
    const headers = ['Date', 'Time', 'Workout Name', 'Duration (min)', 'Exercise', 'Set Number', 'Weight', 'Unit', 'Reps', 'Difficulty'];
    const rows = [headers.join(',')];

    workoutHistory.forEach(workout => {
      const workoutDate = new Date(workout.startTime);
      const dateStr = workoutDate.toLocaleDateString();
      const timeStr = workoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const durationMin = workout.duration ? Math.round(workout.duration / 60) : '';
      const workoutName = `"${workout.templateName.replace(/"/g, '""')}"`;

      workout.exercises.forEach(exercise => {
        const movementName = movements.find(m => m.id === exercise.movementId)?.name || 'Unknown';
        const exerciseNameEscaped = `"${movementName.replace(/"/g, '""')}"`;

        exercise.sets.forEach((set, setIndex) => {
          const difficultyLabel = DIFFICULTY_LEVELS[set.difficulty]?.label || 'None';
          const row = [
            dateStr,
            timeStr,
            workoutName,
            durationMin,
            exerciseNameEscaped,
            setIndex + 1,
            set.weight,
            workout.unit || settings.defaultUnit,
            set.reps,
            difficultyLabel
          ];
          rows.push(row.join(','));
        });
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-export-${getDateKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const handleExportEmail = () => {
    // First, download the JSON file
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings,
      movements,
      bodyParts,
      templates,
      workoutHistory
    };

    const filename = `fitness-tracker-backup-${getDateKey(new Date())}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Then open email client with pre-filled subject and body
    const subject = encodeURIComponent(`Fitness Tracker Backup - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(
      `Fitness Tracker Backup\n\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Workouts: ${workoutHistory.length}\n\n` +
      `Please attach the file "${filename}" that was just downloaded to your device.`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowExportOptions(false);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);

        if (data.settings) saveToStorage(STORAGE_KEYS.settings, data.settings);
        if (data.movements) saveToStorage(STORAGE_KEYS.movements, data.movements);
        if (data.bodyParts) saveToStorage(STORAGE_KEYS.bodyParts, data.bodyParts);
        if (data.templates) saveToStorage(STORAGE_KEYS.workoutTemplates, data.templates);
        if (data.workoutHistory) saveToStorage(STORAGE_KEYS.workoutHistory, data.workoutHistory);

        setImportStatus({ success: true, message: 'Data imported successfully! Please refresh the page.' });
      } catch (error) {
        setImportStatus({ success: false, message: 'Failed to import data. Invalid file format.' });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
        <div className="space-y-4">
          <Select
            label="Default Weight Unit"
            value={settings.defaultUnit}
            onChange={(e) => setSettings({ ...settings, defaultUnit: e.target.value })}
            options={[
              { value: 'lbs', label: 'Pounds (lbs)' },
              { value: 'kg', label: 'Kilograms (kg)' }
            ]}
          />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Button onClick={() => setShowExportOptions(!showExportOptions)}>
                <Icons.Download /> Export Data
              </Button>
              {showExportOptions && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                  >
                    Download as JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-t border-gray-100"
                  >
                    Download as CSV
                  </button>
                  <button
                    onClick={handleExportEmail}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg border-t border-gray-100"
                  >
                    Email backup
                  </button>
                </div>
              )}
            </div>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Icons.Upload /> Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className={`p-3 rounded-lg ${importStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {importStatus.message}
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>Export your workout data as JSON (full backup) or CSV (spreadsheet-friendly).</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-600">{workoutHistory.length}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-600">{movements.length}</div>
            <div className="text-sm text-gray-600">Exercises</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-600">{templates.length}</div>
            <div className="text-sm text-gray-600">Templates</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-600">
              {workoutHistory.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Sets</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function FitnessTracker() {
  const [activeTab, setActiveTab] = useState('workout');

  const [movements, setMovements] = useLocalStorage(STORAGE_KEYS.movements, DEFAULT_MOVEMENTS);
  const [bodyParts, setBodyParts] = useLocalStorage(STORAGE_KEYS.bodyParts, DEFAULT_BODY_PARTS);
  const [workoutHistory, setWorkoutHistory] = useLocalStorage(STORAGE_KEYS.workoutHistory, []);
  const [templates, setTemplates] = useLocalStorage(STORAGE_KEYS.workoutTemplates, []);
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, { defaultUnit: 'lbs' });
  const [lastBackupCount, setLastBackupCount] = useLocalStorage(STORAGE_KEYS.lastBackupCount, 0);

  // Backup reminder state
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showBackupExportOptions, setShowBackupExportOptions] = useState(false);

  // Check if backup reminder should be shown (every 3 workouts)
  useEffect(() => {
    const workoutsSinceBackup = workoutHistory.length - lastBackupCount;
    if (workoutsSinceBackup >= 3) {
      setShowBackupReminder(true);
    }
  }, [workoutHistory.length, lastBackupCount]);

  // Backup export handlers for the reminder modal
  const handleBackupExportJSON = () => {
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings,
      movements,
      bodyParts,
      templates,
      workoutHistory
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-backup-${getDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLastBackupCount(workoutHistory.length);
    setShowBackupExportOptions(false);
    setShowBackupReminder(false);
  };

  const handleBackupExportCSV = () => {
    const headers = ['Date', 'Time', 'Workout Name', 'Duration (min)', 'Exercise', 'Set Number', 'Weight', 'Unit', 'Reps', 'Difficulty'];
    const rows = [headers.join(',')];

    workoutHistory.forEach(workout => {
      const workoutDate = new Date(workout.startTime);
      const dateStr = workoutDate.toLocaleDateString();
      const timeStr = workoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const durationMin = workout.duration ? Math.round(workout.duration / 60) : '';
      const workoutName = `"${workout.templateName.replace(/"/g, '""')}"`;

      workout.exercises.forEach(exercise => {
        const movementName = movements.find(m => m.id === exercise.movementId)?.name || 'Unknown';
        const exerciseNameEscaped = `"${movementName.replace(/"/g, '""')}"`;

        exercise.sets.forEach((set, setIndex) => {
          const difficultyLabel = DIFFICULTY_LEVELS[set.difficulty]?.label || 'None';
          const row = [
            dateStr, timeStr, workoutName, durationMin, exerciseNameEscaped,
            setIndex + 1, set.weight, workout.unit || settings.defaultUnit, set.reps, difficultyLabel
          ];
          rows.push(row.join(','));
        });
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-export-${getDateKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLastBackupCount(workoutHistory.length);
    setShowBackupExportOptions(false);
    setShowBackupReminder(false);
  };

  const handleBackupExportEmail = () => {
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings,
      movements,
      bodyParts,
      templates,
      workoutHistory
    };

    const filename = `fitness-tracker-backup-${getDateKey(new Date())}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const subject = encodeURIComponent(`Fitness Tracker Backup - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(
      `Fitness Tracker Backup\n\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Workouts: ${workoutHistory.length}\n\n` +
      `Please attach the file "${filename}" that was just downloaded to your device.`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;

    setLastBackupCount(workoutHistory.length);
    setShowBackupExportOptions(false);
    setShowBackupReminder(false);
  };

  const dismissBackupReminder = () => {
    setShowBackupReminder(false);
    // Don't update lastBackupCount - will remind again after next workout
  };

  const skipBackupReminder = () => {
    // Update the count so it won't remind until 3 more workouts
    setLastBackupCount(workoutHistory.length);
    setShowBackupReminder(false);
  };

  const tabs = [
    { id: 'workout', label: 'Workout', icon: <Icons.Play /> },
    { id: 'movements', label: 'Exercises', icon: <Icons.Dumbbell /> },
    { id: 'templates', label: 'Templates', icon: <Icons.Edit /> },
    { id: 'trends', label: 'Trends', icon: <Icons.Chart /> },
    { id: 'calendar', label: 'Calendar', icon: <Icons.Calendar /> },
    { id: 'settings', label: 'Settings', icon: <Icons.Settings /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icons.Dumbbell />
            Fitness Tracker
          </h1>
          <p className="text-gray-600 text-sm mt-1">Track your workouts, monitor progress</p>
        </div>

        <div className="mb-6 overflow-x-auto">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="pb-8">
          {activeTab === 'workout' && (
            <ActiveWorkout
              movements={movements}
              setMovements={setMovements}
              templates={templates}
              workoutHistory={workoutHistory}
              setWorkoutHistory={setWorkoutHistory}
              settings={settings}
            />
          )}

          {activeTab === 'movements' && (
            <MovementManager
              movements={movements}
              setMovements={setMovements}
              bodyParts={bodyParts}
              setBodyParts={setBodyParts}
            />
          )}

          {activeTab === 'templates' && (
            <WorkoutTemplates
              templates={templates}
              setTemplates={setTemplates}
              movements={movements}
            />
          )}

          {activeTab === 'trends' && (
            <TrendsView
              workoutHistory={workoutHistory}
              movements={movements}
              settings={settings}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView workoutHistory={workoutHistory} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              workoutHistory={workoutHistory}
              movements={movements}
              bodyParts={bodyParts}
              templates={templates}
            />
          )}
        </div>
      </div>

      {/* Backup Reminder Modal */}
      <Modal
        isOpen={showBackupReminder}
        onClose={dismissBackupReminder}
        title="Time to Back Up Your Data!"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You've logged {workoutHistory.length - lastBackupCount} new workout{workoutHistory.length - lastBackupCount !== 1 ? 's' : ''} since your last backup.
            Would you like to export your data now to keep it safe?
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Remember:</strong> Your workout data is stored in your browser. Clearing your browser data or switching devices will lose your history without a backup.
            </p>
          </div>

          {!showBackupExportOptions ? (
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={skipBackupReminder}>
                Skip for Now
              </Button>
              <Button onClick={() => setShowBackupExportOptions(true)}>
                Yes, Export Data
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose export format:</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleBackupExportJSON}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">Download as JSON</div>
                  <div className="text-sm text-gray-500">Full backup file for restoring data later</div>
                </button>
                <button
                  onClick={handleBackupExportCSV}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">Download as CSV</div>
                  <div className="text-sm text-gray-500">Spreadsheet format for viewing in Excel</div>
                </button>
                <button
                  onClick={handleBackupExportEmail}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">Email backup</div>
                  <div className="text-sm text-gray-500">Download file and compose email to send it</div>
                </button>
              </div>
              <button
                onClick={() => setShowBackupExportOptions(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
