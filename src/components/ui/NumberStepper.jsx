import React from 'react';
import Icons from '../icons/Icons';

const NumberStepper = ({ value, onChange, min = 1, max = 20, label }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        disabled={value <= min}
      >
        <Icons.ChevronDown />
      </button>
      <div className="w-16 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        disabled={value >= max}
      >
        <Icons.ChevronUp />
      </button>
    </div>
  </div>
);

export default NumberStepper;
