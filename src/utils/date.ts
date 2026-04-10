/**
 * Normalize date strings into Date objects.
 * EcoleDirecte uses formats like "2026-03-24 18:22", "2026-03-24", "19/01/2026", "2026-03-17 16:08:27"
 */
export function normalizeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  // Handle DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }

  // Handle YYYY-MM-DD HH:mm:ss or YYYY-MM-DD HH:mm or YYYY-MM-DD
  const date = new Date(dateStr.replace(/-/g, '/')); // replace - with / for better cross-browser compatibility
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}
