import { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

/**
 * React state hook backed by localStorage.
 *
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {[T, import('react').Dispatch<import('react').SetStateAction<T>>]}
 */
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => loadFromStorage(key, defaultValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
};

export default useLocalStorage;
