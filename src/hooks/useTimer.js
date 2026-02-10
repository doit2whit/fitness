import { useState, useEffect, useCallback } from 'react';
import { formatTime } from '../utils/helpers';

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
