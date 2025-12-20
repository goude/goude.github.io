/**
 * Calculate ISO week number (SS-ISO 8601-1)
 */
export function getISOWeek(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const isoDow = d.getDay() === 0 ? 7 : d.getDay();
  const th = new Date(d);
  th.setDate(th.getDate() + (4 - isoDow));
  const weekYear = th.getFullYear();
  const jan4 = new Date(weekYear, 0, 4);
  const jan4IsoDow = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const week1Mon = new Date(weekYear, 0, 4 - (jan4IsoDow - 1));
  const toUTCmid = (x: Date) =>
    Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const daysSinceWeek1Mon = Math.round(
    (toUTCmid(th) - toUTCmid(week1Mon)) / 86400000
  );
  return Math.floor(daysSinceWeek1Mon / 7) + 1;
}

/**
 * Pad number with leading zeros
 */
export function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}
