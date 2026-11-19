import { describe, expect, it } from 'vitest';
import { argentinaDate, argentinaWeek, isCalendarDate } from '../src/lib/dates';

describe('Agenda argentina', () => {
  it('conserva el domingo argentino cuando UTC ya es lunes', () => {
    const now = new Date('2026-11-23T01:30:00Z');
    expect(argentinaDate(now)).toBe('2026-11-22');
    expect(argentinaWeek(now)).toMatchObject({ start: '2026-11-16', end: '2026-11-22' });
  });
  it('calcula una semana que cruza año y admite una fecha de navegación', () => {
    expect(argentinaWeek(new Date('2026-11-19T15:00:00Z'), '2027-01-01')).toMatchObject({ start: '2026-12-28', end: '2027-01-03', previous: '2026-12-21', next: '2027-01-04' });
  });
  it('rechaza una fecha inexistente', () => {
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(isCalendarDate('2024-02-29')).toBe(true);
  });
});
