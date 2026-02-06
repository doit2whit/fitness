import { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => loadFromStorage(key, defaultValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
};

export default useLocalStorage;
