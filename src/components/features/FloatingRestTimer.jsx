import React, { useState, useEffect } from 'react';
import { formatTime } from '../../utils/helpers';

/**
 * @typedef {object} FloatingRestTimerProps
 * @property {number | null} [lastSetRepStartTime] - epoch ms from the previous set's first rep; timer measures rest since then
 */

/** @param {FloatingRestTimerProps} props */
const FloatingRestTimer = ({ lastSetRepStartTime }) => {
  /** @type {[number | null, import('react').Dispatch<import('react').SetStateAction<number | null>>]} */
  const [liveTime, setLiveTime] = useState(/** @type {number | null} */ (null));

  useEffect(() => {
    if (lastSetRepStartTime) {
      const updateTimer = () => {
        const elapsed = Math.round((Date.now() - lastSetRepStartTime) / 1000);
        setLiveTime(elapsed);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveTime(null);
    }
  }, [lastSetRepStartTime]);

  if (liveTime === null) return null;

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="h-5 text-xs font-mono text-orange-500 font-semibold">
        {formatTime(liveTime)}
      </div>
      <div className="text-sm text-gray-400 dark:text-gray-500 px-2 py-1">⏱</div>
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
        +
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500">Next?</span>
      <div className="w-14 h-6" />
    </div>
  );
};

export default FloatingRestTimer;
