import { useRef, useEffect, useCallback } from 'react';

/**
 * @typedef {object} LongPressHandlers
 * @property {() => void} onMouseDown
 * @property {() => void} onMouseUp
 * @property {() => void} onMouseLeave
 * @property {() => void} onTouchStart
 * @property {() => void} onTouchEnd
 */

/**
 * Invokes `callback` when an element is pressed continuously for `ms` milliseconds.
 * Returns an object of handlers to spread onto a DOM element.
 *
 * @param {() => void} callback
 * @param {number} [ms=3000]
 * @returns {LongPressHandlers}
 */
const useLongPress = (callback, ms = 3000) => {
  /** @type {import('react').MutableRefObject<ReturnType<typeof setTimeout> | null>} */
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      callbackRef.current();
    }, ms);
  }, [ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop
  };
};

export default useLongPress;
