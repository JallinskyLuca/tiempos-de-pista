import type { F1Session, SessionLap } from './openf1';

export type TelemetryPoint = { t:number; speed:number|null; throttle:number|null; brake:number|null; gear:number|null; rpm:number|null };
export function telemetryQuery(session:number,driver:number,window:{from:string;to:string}) {
  // En una URL, el '=' del comparador es también el separador entre clave y valor.
  return new URLSearchParams({session_key:String(session),driver_number:String(driver),'date>':window.from,'date<':window.to});
}
export function telemetryWindow(session:Pick<F1Session,'startsAt'|'endsAt'>, lap:SessionLap) {
  const start = Date.parse(lap.startsAt ?? '');
  if (!Number.isFinite(start)) return null;
  const end = Math.min(Date.parse(session.endsAt)+15*60_000, start + ((lap.duration ?? 60) * 1000));
  const from = Math.max(start, end - 180_000, Date.parse(session.startsAt));
  return end > from ? { from:new Date(from).toISOString(), to:new Date(end).toISOString(), truncated:end-start > 180_000 } : null;
}
export function normalizeTelemetry(rows:unknown[], from:string):TelemetryPoint[] {
  const valid = (value:unknown, max:number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
  return rows.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const r = raw as Record<string,unknown>;
    const t = (Date.parse(String(r.date))-Date.parse(from))/1000;
    if (!Number.isFinite(t) || t < 0 || t > 180) return [];
    return [{ t, speed:valid(r.speed,450), throttle:valid(r.throttle,100), brake:valid(r.brake,100), gear:valid(r.n_gear,8), rpm:valid(r.rpm,25000) }];
  }).sort((a,b) => a.t-b.t);
}
