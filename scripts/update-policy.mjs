const zone = 'America/Argentina/Buenos_Aires';
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });

export function hasFinal(event, category) {
  const finals = event.tables.filter((table) => /^(carrera|final)\b/i.test(table.name) && !/parciales/i.test(table.name));
  return category === 'tn' ? ['Clase 2', 'Clase 3'].every((group) => finals.some((table) => table.group === group)) : finals.length > 0;
}

export function updateWindow(events, category, now = new Date()) {
  const today = dateFormat.format(now);
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone: zone, hour: 'numeric', hourCycle: 'h23' }).format(now));
  for (const event of events) {
    const starts = (event.schedule ?? []).map(([, time]) => Date.parse(time)).filter(Number.isFinite);
    if (starts.some((time) => now.getTime() >= time - 60 * 60_000 && now.getTime() <= time + 6 * 60 * 60_000)) return { active: true, reason: 'actividad', eventId: event.id };
    const days = (Date.parse(event.date + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86_400_000;
    if (!starts.length && days >= 0 && days <= 2 && hour >= 7 && hour < 23) return { active: true, reason: 'fin-de-semana', eventId: event.id };
    if (days < 0 && days >= -2 && !hasFinal(event, category)) return { active: true, reason: 'resultado-pendiente', eventId: event.id };
  }
  return { active: false, reason: 'sin-actividad' };
}
