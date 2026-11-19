import type { ArchiveEvent } from './archive';
import type { Category } from './racing';

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function fold(line: string) {
  const lines = [];
  let part = '';
  for (const character of line) {
    if (new TextEncoder().encode(part + character).length > 74) { lines.push(part); part = ' '; }
    part += character;
  }
  return [...lines, part].join('\r\n');
}

export function eventCalendar(category: Category, year: string, event: ArchiveEvent, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const sessions = event.schedule ?? [];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tiempos de Pista//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const entries = sessions.length ? sessions : [[event.name, event.date] as [string, string]];
  for (const [name, instant] of entries) {
    const start = instant.length === 10 ? 'DTSTART;VALUE=DATE:' + instant.replace(/-/g, '') : 'DTSTART:' + new Date(instant).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    lines.push('BEGIN:VEVENT', `UID:${category}-${year}-${event.id}-${encodeURIComponent(name)}@tiemposdepista`, `DTSTAMP:${stamp}`, start, `SUMMARY:${escapeText(sessions.length ? `${category.toUpperCase()} · ${event.name} · ${name}` : `${category.toUpperCase()} · ${event.name}`)}`, `LOCATION:${escapeText(event.venue ?? event.name)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
