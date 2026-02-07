import React from 'react';

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    orange: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    indigo: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
};

export default Badge;
