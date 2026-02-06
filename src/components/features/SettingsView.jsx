import React, { useRef, useState } from 'react';
import { DIFFICULTY_LEVELS, STORAGE_KEYS } from '../../utils/constants';
import { getDateKey } from '../../utils/helpers';
import { saveToStorage } from '../../utils/storage';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';

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

export default SettingsView;
