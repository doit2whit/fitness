import React from 'react';

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-900 p-1.5">
    <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap flex-1 ${
            activeTab === tab.id
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-900'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  </div>
);

export default Tabs;
