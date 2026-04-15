import React from 'react';

/**
 * @typedef {object} CardProps
 * @property {import('react').ReactNode} [children]
 * @property {string} [className]
 * @property {import('react').MouseEventHandler<HTMLDivElement>} [onClick]
 */

/** @param {CardProps} props */
const Card = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-900 ${onClick ? 'cursor-pointer hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200' : 'transition-shadow duration-200'} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export default Card;
