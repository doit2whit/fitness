import React from 'react';
import Icons from '../icons/Icons';

const TimerDisplay = ({ label, time, isRunning, onReset }) => (
  <div className="flex items-center gap-3 bg-gray-50 dark:bg-navy-900 rounded-lg px-4 py-2">
    <Icons.Timer />
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-mono font-bold ${isRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
        {time}
      </div>
    </div>
    {onReset && (
      <button onClick={onReset} className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 text-xs">
        Reset
      </button>
    )}
  </div>
);

export default TimerDisplay;
