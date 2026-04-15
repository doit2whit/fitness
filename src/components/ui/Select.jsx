import React from 'react';

/**
 * @typedef {object} SelectOption
 * @property {string | number} value
 * @property {string} label
 * @property {boolean} [disabled]
 */

/**
 * @typedef {object} SelectProps
 * @property {string} [label]
 * @property {SelectOption[]} options
 * @property {string | number} value
 * @property {import('react').ChangeEventHandler<HTMLSelectElement>} onChange
 * @property {string} [className]
 */

/** @param {SelectProps} props */
const Select = ({ label, options, value, onChange, className = '' }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-navy-900 text-gray-900 dark:text-gray-100 ${className}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default Select;
