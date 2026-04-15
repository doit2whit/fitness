/**
 * Load a JSON value from localStorage, returning a default if missing or invalid.
 *
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {T}
 */
export const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Save a JSON-serializable value to localStorage. Logs on failure rather than throwing.
 *
 * @param {string} key
 * @param {unknown} value
 * @returns {void}
 */
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};
