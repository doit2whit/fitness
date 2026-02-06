import { useEffect, useRef } from 'react';

/**
 * useWakeLock - prevents screen from turning off during interval timers
 *
 * @param {boolean} isActive - whether to hold the wake lock
 *
 * Uses the Screen Wake Lock API. Silently no-ops on browsers that don't support it.
 * Automatically re-acquires the lock if the page becomes visible again (e.g., switching tabs).
 */
const useWakeLock = (isActive) => {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      // Release wake lock when not active
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (e) {
        // Wake lock request failed (e.g., low battery) — silently continue
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isActive]);
};

export default useWakeLock;
