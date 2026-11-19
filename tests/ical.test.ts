import { expect, it } from 'vitest';
import { eventCalendar } from '../src/lib/ical';

it('exporta el inicio UTC y el mismo UID aunque se descargue otro día', () => {
  const event = { id: '21', round: 21, name: 'Las Vegas, Estados Unidos', date: '2026-11-22', source: 'F1DB', tables: [], schedule: [['Carrera', '2026-11-22T04:00:00Z'] as [string, string]] };
  const first = eventCalendar('f1', '2026', event, new Date('2026-11-19T12:00:00Z'));
  const second = eventCalendar('f1', '2026', event, new Date('2026-11-20T12:00:00Z'));
  expect(first).toContain('DTSTART:20261122T040000Z');
  expect(first).toContain('Las Vegas\\, Estados Unidos');
  expect(first.match(/UID:[^\r]+/)?.[0]).toBe(second.match(/UID:[^\r]+/)?.[0]);
});

it('normaliza un horario con desplazamiento y milisegundos a UTC', () => {
  const event = { id: '14', round: 14, name: 'Río Cuarto', date: '2026-11-15', source: 'ACTC', tables: [], schedule: [['Final', '2026-11-15T14:00:00.000-03:00'] as [string, string]] };
  expect(eventCalendar('tc', '2026', event)).toContain('DTSTART:20261115T170000Z');
});
