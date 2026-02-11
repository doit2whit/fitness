export const DIFFICULTY_LEVELS = [
  { value: 0, label: 'None', color: '#e5e7eb', textColor: '#6b7280' },
  { value: 1, label: 'Very Easy', color: '#1e40af', textColor: '#ffffff' },
  { value: 2, label: 'Easy', color: '#60a5fa', textColor: '#ffffff' },
  { value: 3, label: 'Moderate', color: '#f97316', textColor: '#ffffff' },
  { value: 4, label: 'Hard', color: '#fca5a5', textColor: '#991b1b' },
  { value: 5, label: 'Very Hard', color: '#dc2626', textColor: '#ffffff' }
];

export const DEFAULT_BODY_PARTS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Glutes'
];

export const DEFAULT_MOVEMENTS = [
  { id: '1', name: 'Bench Press', bodyParts: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '2', name: 'Barbell Squats', bodyParts: ['Quads', 'Glutes', 'Core'] },
  { id: '3', name: 'Deadlift', bodyParts: ['Back', 'Hamstrings', 'Glutes', 'Core'] },
  { id: '4', name: 'Overhead Press', bodyParts: ['Shoulders', 'Triceps', 'Core'] },
  { id: '5', name: 'Barbell Row', bodyParts: ['Back', 'Biceps', 'Core'] },
  { id: '6', name: 'Pull-Ups', bodyParts: ['Back', 'Biceps', 'Core'] },
  { id: '7', name: 'Dumbbell Curl', bodyParts: ['Biceps'] },
  { id: '8', name: 'Tricep Press', bodyParts: ['Triceps'] },
  { id: '9', name: 'Leg Press', bodyParts: ['Quads', 'Glutes'] },
  { id: '10', name: 'Dumbbell Fly', bodyParts: ['Chest', 'Shoulders'] },
  { id: '11', name: 'Reverse Lunges', bodyParts: ['Quads', 'Glutes', 'Hamstrings', 'Core'] },
  { id: '12', name: 'Forward Lunges', bodyParts: ['Quads', 'Glutes', 'Hamstrings', 'Core'] },
  { id: '13', name: 'Split Squat', bodyParts: ['Quads', 'Glutes', 'Hamstrings', 'Core'] },
  { id: '14', name: 'Romanian Dead Lift', bodyParts: ['Hamstrings', 'Glutes', 'Back', 'Core'] },
  { id: '15', name: 'SLDL', bodyParts: ['Hamstrings', 'Glutes', 'Back', 'Core'] },
  { id: '16', name: 'Dumbbell Row', bodyParts: ['Back', 'Biceps', 'Core'] },
  { id: '17', name: 'Calf Raises', bodyParts: ['Calves'] },
  { id: '18', name: 'Farmers Walk', bodyParts: ['Forearms', 'Core', 'Traps', 'Shoulders'] },
  { id: '19', name: 'Hex Bar Deadlift', bodyParts: ['Quads', 'Glutes', 'Back', 'Hamstrings', 'Core'] },
  { id: '20', name: 'Dumbbell Lateral Raises', bodyParts: ['Shoulders'] },
  { id: '21', name: 'Woodcutters', bodyParts: ['Core', 'Shoulders'] },
  { id: '22', name: 'Dumbbell Pullover', bodyParts: ['Back', 'Chest'] },
  { id: '23', name: 'Bulgarian Split Squats', bodyParts: ['Quads', 'Glutes', 'Hamstrings', 'Core'] },
  { id: '24', name: 'Incline Bench Press', bodyParts: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '25', name: 'Bent-over Reverse Flys', bodyParts: ['Shoulders', 'Back'] },
  { id: '26', name: 'Pushups', bodyParts: ['Chest', 'Triceps', 'Shoulders', 'Core'] }
];

export const DEFAULT_BAR_WEIGHT = { lbs: 45, kg: 20 };
export const DEFAULT_SETS = 5;
export const DEFAULT_WEIGHT = 1;

// Interval exercise defaults
export const DEFAULT_WORK_DURATION = 30;  // seconds
export const DEFAULT_REST_DURATION = 10;  // seconds
export const DEFAULT_ROUNDS = 6;

// Tier system for auto-progression
export const TIER_LABELS = { 1: 'T1', 2: 'T2', 3: 'T3', 4: 'T4' };
export const TIER_REP_THRESHOLDS = { 1: 6, 2: 10, 3: 12, 4: 15 };
export const WEIGHT_INCREMENT = { lbs: 5, kg: 2.5 };

export const DEFAULT_TEMPLATES = [
  {
    id: 'default_day1',
    name: 'Day 1: Legs and Vertical Press',
    movements: [
      { movementId: '19', type: 'sets', sets: 3, unit: 'lbs', tier: 1, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '4', type: 'sets', sets: 4, unit: 'lbs', tier: 1, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '16', type: 'sets', sets: 3, unit: 'kg', tier: 3, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '20', type: 'sets', sets: 3, unit: 'kg', tier: 4, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '18', type: 'interval', sets: null, unit: null, tier: null, workDuration: 45, restDuration: 90, rounds: 3 }
    ]
  },
  {
    id: 'default_day2',
    name: 'Day 2: Chest and Hinge',
    movements: [
      { movementId: '1', type: 'sets', sets: 4, unit: 'lbs', tier: 1, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '14', type: 'sets', sets: 3, unit: 'kg', tier: 2, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '21', type: 'sets', sets: 3, unit: 'kg', tier: 4, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '22', type: 'sets', sets: 3, unit: 'kg', tier: 4, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '8', type: 'sets', sets: 3, unit: 'kg', tier: 3, workDuration: 30, restDuration: 10, rounds: 6 }
    ]
  },
  {
    id: 'default_day3',
    name: 'Day 3: Unilateral and Athletic',
    movements: [
      { movementId: '23', type: 'sets', sets: 4, unit: 'kg', tier: 1, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '24', type: 'sets', sets: 3, unit: 'kg', tier: 2, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '25', type: 'sets', sets: 3, unit: 'kg', tier: 4, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '7', type: 'sets', sets: 3, unit: 'kg', tier: 3, workDuration: 30, restDuration: 10, rounds: 6 },
      { movementId: '26', type: 'sets', sets: 3, unit: 'lbs', tier: null, workDuration: 30, restDuration: 10, rounds: 6 }
    ]
  }
];

export const STORAGE_KEYS = {
  movements: 'fitness_movements',
  bodyParts: 'fitness_bodyParts',
  workoutHistory: 'fitness_workoutHistory',
  workoutTemplates: 'fitness_workoutTemplates',
  settings: 'fitness_settings',
  lastBackupCount: 'fitness_lastBackupCount',
  activeWorkout: 'fitness_activeWorkout',
  activeWorkoutFlag: 'fitness_activeWorkout_active',
  deletedDefaultTemplates: 'fitness_deletedDefaultTemplates'
};
