/**
 * Normalize date strings into Date objects.
 * EcoleDirecte uses formats like "2026-03-24 18:22", "2026-03-24", "19/01/2026", "2026-03-17 16:08:27"
 */
export function normalizeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  const len = dateStr.length;

  // Handle DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }

  // Handle YYYY-MM-DD formats (length >= 10, e.g., "2026-03-24")
  if (len >= 10 && dateStr[4] === '-' && dateStr[7] === '-') {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(5, 7), 10);
    const day = parseInt(dateStr.substring(8, 10), 10);

    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      if (len === 10) {
        return new Date(year, month - 1, day);
      }
      // YYYY-MM-DD HH:mm (length 16)
      if (len === 16 && dateStr[10] === ' ' && dateStr[13] === ':') {
        const hours = parseInt(dateStr.substring(11, 13), 10);
        const minutes = parseInt(dateStr.substring(14, 16), 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          return new Date(year, month - 1, day, hours, minutes);
        }
      }
      // YYYY-MM-DD HH:mm:ss (length 19)
      if (len === 19 && dateStr[10] === ' ' && dateStr[13] === ':' && dateStr[16] === ':') {
        const hours = parseInt(dateStr.substring(11, 13), 10);
        const minutes = parseInt(dateStr.substring(14, 16), 10);
        const seconds = parseInt(dateStr.substring(17, 19), 10);
        if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
          return new Date(year, month - 1, day, hours, minutes, seconds);
        }
      }
    }
  }

  // Fallback for other formats
  const date = new Date(dateStr.replace(/-/g, '/')); // replace - with / for better cross-browser compatibility
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}
