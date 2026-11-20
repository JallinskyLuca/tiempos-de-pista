import type { ArchiveEvent } from './archive';
import { argentinaWeek } from './dates';

export function orderCalendar(events:ArchiveEvent[], now=new Date()) {
  const week=argentinaWeek(now);
  const sorted=events.toSorted((a,b)=>b.date.localeCompare(a.date)||b.round-a.round);
  const thisWeek=events.find((event)=>event.date>=week.start && event.date<=week.end);
  const next=events.filter((event)=>event.date>=week.today).toSorted((a,b)=>a.date.localeCompare(b.date))[0];
  const featured=thisWeek??next;
  return {featured,label:thisWeek?'Este fin de semana':'Próxima fecha',events:featured?[featured,...sorted.filter((event)=>event.id!==featured.id)]:sorted};
}
