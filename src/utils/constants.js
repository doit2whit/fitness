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
  { id: '19', name: 'Hex Bar Deadlift', bodyParts: ['Quads', 'Glutes', 'Back', 'Hamstrings', 'Core'] }
];

export const DEFAULT_BAR_WEIGHT = { lbs: 45, kg: 20 };
export const DEFAULT_SETS = 5;
export const DEFAULT_WEIGHT = 1;

// Interval exercise defaults
export const DEFAULT_WORK_DURATION = 30;  // seconds
export const DEFAULT_REST_DURATION = 10;  // seconds
export const DEFAULT_ROUNDS = 6;

export const STORAGE_KEYS = {
  movements: 'fitness_movements',
  bodyParts: 'fitness_bodyParts',
  workoutHistory: 'fitness_workoutHistory',
  workoutTemplates: 'fitness_workoutTemplates',
  settings: 'fitness_settings',
  lastBackupCount: 'fitness_lastBackupCount'
};
