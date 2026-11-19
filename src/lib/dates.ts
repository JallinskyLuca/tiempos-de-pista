export const argentinaTimeZone = 'America/Argentina/Buenos_Aires';

const dateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: argentinaTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function argentinaDate(now = new Date()) {
  return dateKey.format(now);
}

export function isCalendarDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
}

export function shiftDate(date: string, days: number) {
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function argentinaWeek(now = new Date(), selectedDate?: string) {
  const today = argentinaDate(now);
  const anchor = selectedDate && isCalendarDate(selectedDate) ? selectedDate : today;
  const weekday = new Date(anchor + 'T12:00:00Z').getUTCDay();
  const start = shiftDate(anchor, -((weekday + 6) % 7));
  return { today, start, end: shiftDate(start, 6), previous: shiftDate(start, -7), next: shiftDate(start, 7) };
}
