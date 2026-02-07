import React, { useState } from 'react';
import Icons from '../icons/Icons';

/**
 * TimeStepper — time input that steps in 5-second increments
 * Displays values as "0:30", "1:00", etc.
 * Allows typing a custom value via an inline text input.
 */
const TimeStepper = ({ value, onChange, min = 5, max = 600, step = 5, label }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const formatSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditStart = () => {
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleEditConfirm = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      // Round to nearest step
      const rounded = Math.round(parsed / step) * step;
      onChange(Math.max(min, Math.min(max, rounded)));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleEditConfirm();
    if (e.key === 'Escape') setIsEditing(false);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          disabled={value <= min}
        >
          <Icons.ChevronDown />
        </button>
        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleKeyDown}
            className="w-20 text-center text-lg font-bold text-gray-900 dark:text-gray-100 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-navy-900"
            autoFocus
            min={min}
            max={max}
            placeholder="sec"
          />
        ) : (
          <button
            onClick={handleEditStart}
            className="w-20 text-center text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Click to type custom seconds"
          >
            {formatSeconds(value)}
          </button>
        )}
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          disabled={value >= max}
        >
          <Icons.ChevronUp />
        </button>
      </div>
      {isEditing && (
        <p className="text-xs text-gray-400 text-center">Enter seconds, then press Enter</p>
      )}
    </div>
  );
};

export default TimeStepper;
