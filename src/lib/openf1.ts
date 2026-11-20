import { cache } from 'react';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ArchiveTable } from './archive';
import { lapTime } from './openf1-format';

export type SessionLap = { driver:number; number:number; startsAt:string|null; duration:number|null; sectors:(number|null)[]; pitOut:boolean };
export type F1Session = { key:number; name:string; year:number; startsAt:string; endsAt:string; publishedAt:string; circuit:string; state:'classified'|'no-timed-laps'; note?:{text:string;source:string}; drivers:{number:number;name:string;code:string;team:string}[]; results:{number:number;position:number|null;laps:number|null;duration:number|number[]|null;gap:number|number[]|string|null;status:string}[]; laps:SessionLap[] };
type SessionEntry = { key:number;year:number;eventId:string;name:string;file:string;endsAt:string;publishedAt:string };
export const getSessionIndex = cache(async ():Promise<{revision:string;sessions:SessionEntry[]}> => JSON.parse(await readFile(join(process.cwd(),'data/openf1/index.json'),'utf8')));
export const getF1Session = cache(async (key:number):Promise<F1Session|null> => {
  const entry = (await getSessionIndex()).sessions.find((entry) => entry.key === key);
  if (!entry || !/^[a-f\d]{64}$/.test(entry.file)) return null;
  return JSON.parse(await readFile(join(process.cwd(),'data/openf1/sessions',entry.file+'.json'),'utf8'));
});
export async function getEventSessions(year:string, eventId:string) {
  const entries = (await getSessionIndex()).sessions.filter((entry) => String(entry.year) === year && entry.eventId === eventId);
  return (await Promise.all(entries.map((entry) => getF1Session(entry.key)))).filter((session):session is F1Session => Boolean(session));
}
export function sessionTable(session:F1Session):ArchiveTable {
  const time = (value:number|number[]|null) => Array.isArray(value) ? value.map(lapTime).join(' / ') : lapTime(value);
  const gap = (value:number|number[]|string|null):string => Array.isArray(value) ? value.map(gap).join(' / ') : value === null ? '—' : typeof value === 'number' ? value === 0 ? 'Líder' : `+${value.toFixed(3)}s` : value;
  return { name:`${session.name} · OpenF1`, sourceUrl:`https://api.openf1.org/v1/session_result?session_key=${session.key}`, columns:['Pos.','N°','Piloto','Equipo','Tiempo','Diferencia','Vueltas','Estado'], rows:session.results.map((r) => {
    const d = session.drivers.find((d) => d.number === r.number);
    return [r.position ?? '—',r.number,d?.name ?? `Auto ${r.number}`,d?.team ?? '—',time(r.duration),gap(r.gap),r.laps ?? '—',r.status];
  }) };
}
