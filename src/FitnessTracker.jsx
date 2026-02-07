import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULT_MOVEMENTS, DEFAULT_BODY_PARTS, DIFFICULTY_LEVELS } from './utils/constants';
import { getDateKey } from './utils/helpers';
import useLocalStorage from './hooks/useLocalStorage';
import Icons from './components/icons/Icons';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import Tabs from './components/ui/Tabs';
import ActiveWorkout from './components/features/ActiveWorkout';
import MovementManager from './components/features/MovementManager';
import WorkoutTemplates from './components/features/WorkoutTemplates';
import TrendsView from './components/features/TrendsView';
import CalendarView from './components/features/CalendarView';
import SettingsView from './components/features/SettingsView';

export default function FitnessTracker() {
  const [activeTab, setActiveTab] = useState('workout');

  const [movements, setMovements] = useLocalStorage(STORAGE_KEYS.movements, DEFAULT_MOVEMENTS);
  const [bodyParts, setBodyParts] = useLocalStorage(STORAGE_KEYS.bodyParts, DEFAULT_BODY_PARTS);
  const [workoutHistory, setWorkoutHistory] = useLocalStorage(STORAGE_KEYS.workoutHistory, []);
  const [templates, setTemplates] = useLocalStorage(STORAGE_KEYS.workoutTemplates, []);
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, { defaultUnit: 'lbs' });
  const [lastBackupCount, setLastBackupCount] = useLocalStorage(STORAGE_KEYS.lastBackupCount, 0);

  // Theme management
  useEffect(() => {
    const applyTheme = () => {
      const theme = settings.theme || 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Update meta theme-color
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', isDark ? '#0f1724' : '#059669');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if ((settings.theme || 'system') === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

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
  };

  const skipBackupReminder = () => {
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
    <div className="min-h-screen bg-cream-100 dark:bg-navy-900 transition-colors duration-200">
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400"><Icons.Dumbbell /></span>
            Whitman Fitman
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your workouts, monitor progress</p>
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
          <p className="text-gray-600 dark:text-gray-400">
            You've logged {workoutHistory.length - lastBackupCount} new workout{workoutHistory.length - lastBackupCount !== 1 ? 's' : ''} since your last backup.
            Would you like to export your data now to keep it safe?
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose export format:</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleBackupExportJSON}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-navy-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">Download as JSON</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Full backup file for restoring data later</div>
                </button>
                <button
                  onClick={handleBackupExportCSV}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-navy-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">Download as CSV</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Spreadsheet format for viewing in Excel</div>
                </button>
                <button
                  onClick={handleBackupExportEmail}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-navy-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">Email backup</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Download file and compose email to send it</div>
                </button>
              </div>
              <button
                onClick={() => setShowBackupExportOptions(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
