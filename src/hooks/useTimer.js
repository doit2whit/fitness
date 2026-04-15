import { useState, useEffect, useCallback } from 'react';
import { formatTime } from '../utils/helpers';

/**
 * @typedef {object} TimerControls
 * @property {number} seconds
 * @property {(val?: number) => void} reset
 * @property {string} formatted - seconds rendered as `H:MM:SS` or `M:SS`
 */

/**
 * Simple seconds-counting timer. Ticks while `isRunning` is true.
 *
 * @param {boolean} isRunning
 * @param {number} [initialSeconds=0]
 * @returns {TimerControls}
 */
const useTimer = (isRunning, initialSeconds = 0) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Sync when initialSeconds changes (e.g., component re-mounts with resumed value)
  useEffect(() => {
    if (initialSeconds > 0) setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = useCallback((val = 0) => setSeconds(val), []);

  return { seconds, reset, formatted: formatTime(seconds) };
};

export default useTimer;
