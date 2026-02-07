import { useState, useEffect, useCallback } from 'react';
import { formatTime } from '../utils/helpers';

const useTimer = (isRunning) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, reset, formatted: formatTime(seconds) };
};

export default useTimer;
