/**
 * Generate a short random ID. Not cryptographically strong.
 * @returns {string}
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Format a duration in seconds as `H:MM:SS` (or `M:SS` under an hour).
 * @param {number} seconds
 * @returns {string}
 */
export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Local-date calendar key in `YYYY-MM-DD` form. Used for grouping workouts by day.
 * @param {Date | string | number} date
 * @returns {string}
 */
export const getDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Convert kilograms to pounds, rounded to the nearest whole number.
 * @param {number} kg
 * @returns {number}
 */
export const kgToLbs = (kg) => Math.round(kg * 2.20462);
