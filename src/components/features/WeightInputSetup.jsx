import React, { useMemo } from 'react';
import { DEFAULT_BAR_WEIGHT } from '../../utils/constants';
import Input from '../ui/Input';

const WeightInputSetup = ({ value, onChange, unit, isOneSide, onOneSideChange, barWeight, onBarWeightChange, ignoreBarWeight, onIgnoreBarWeightChange }) => {
  const calculatedTotal = useMemo(() => {
    if (!isOneSide || !value) return value;
    const sideWeight = parseFloat(value) || 0;
    if (ignoreBarWeight) {
      return sideWeight * 2;
    }
    const bar = parseFloat(barWeight) || DEFAULT_BAR_WEIGHT[unit];
    return (sideWeight * 2) + bar;
  }, [value, isOneSide, barWeight, unit, ignoreBarWeight]);

  return (
    <div className="space-y-3">
      <Input
        label="Starting Weight"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isOneSide ? "Weight per side" : "Total weight"}
        min="0"
        step="2.5"
      />

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isOneSide}
            onChange={(e) => onOneSideChange(e.target.checked)}
            className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">One-side entry</span>
        </label>

        {isOneSide && (
          <>
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={ignoreBarWeight}
                onChange={(e) => onIgnoreBarWeightChange(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ignore bar weight</span>
            </label>

            {!ignoreBarWeight && (
              <div className="flex items-center gap-2 ml-6">
                <span className="text-sm text-gray-500 dark:text-gray-400">Bar:</span>
                <input
                  type="number"
                  value={barWeight}
                  onChange={(e) => onBarWeightChange(e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                  placeholder={DEFAULT_BAR_WEIGHT[unit]}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
              </div>
            )}
          </>
        )}
      </div>

      {isOneSide && value && (
        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          Total: {calculatedTotal} {unit}
        </div>
      )}
    </div>
  );
};

export default WeightInputSetup;
