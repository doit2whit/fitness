import React from 'react';

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200">
    <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  </div>
);

export default Tabs;
