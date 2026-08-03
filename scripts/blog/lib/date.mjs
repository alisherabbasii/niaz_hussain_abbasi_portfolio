/** Returns today's date as `YYYY-MM-DD` (UTC), matching the format posts are authored in. */
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Strictly validates a `YYYY-MM-DD` string, rejecting both malformed strings
 * and calendar-invalid ones (e.g. `2026-02-30`, which `Date` would silently
 * roll forward into March). */
export function isValidCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

/** True when `value` (a `YYYY-MM-DD` string already known to be valid) is after today, UTC. */
export function isFutureDate(value) {
  return value > todayIso();
}
