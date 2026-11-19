export const categories = {
  tc: { short: 'TC', name: 'Turismo Carretera', region: 'Argentina' },
  f1: { short: 'F1', name: 'Fórmula 1', region: 'Internacional' },
  tn: { short: 'TN', name: 'TN APAT', region: 'Argentina' },
} as const;

export type Category = keyof typeof categories;
export type Result = [driver: string, car: string, time: string];
export type Standing = [driver: string, points: number];

export type Session = {
  name: string;
  startsAt?: string;
  results?: Result[];
  source?: string;
};

export type Race = {
  id: string;
  category: Category;
  name: string;
  venue: string;
  round: number;
  date: string;
  source: string;
  sessions: Session[];
};

export type Championship = {
  category: Category;
  name: string;
  source: string;
  rows: Standing[];
};

import { argentinaTimeZone } from './dates';

const clock = new Intl.DateTimeFormat('es-AR', {
  timeZone: argentinaTimeZone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const shortDate = new Intl.DateTimeFormat('es-AR', {
  timeZone: argentinaTimeZone,
  day: 'numeric',
  month: 'short',
});
const weekdayDate = new Intl.DateTimeFormat('es-AR', {
  timeZone: argentinaTimeZone,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
});
const points = new Intl.NumberFormat('es-AR');

export function formatTime(instant: string) {
  return clock.format(new Date(instant));
}

export function formatDate(dayOrInstant: string, withWeekday = false) {
  const instant = dayOrInstant.length === 10 ? `${dayOrInstant}T12:00:00Z` : dayOrInstant;
  return (withWeekday ? weekdayDate : shortDate).format(new Date(instant));
}

export function formatPoints(value: number) {
  return points.format(value);
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && Object.hasOwn(categories, value);
}

export function archiveRaceHref({ category, date, round }: Pick<Race, 'category' | 'date' | 'round'>) {
  return `/categoria/${category}/archivo/${date.slice(0, 4)}/${category === 'tn' ? date : round}`;
}
