export type { F1Session, SessionLap } from './openf1';
export function lapTime(seconds:number|null) {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  return `${Math.floor(seconds/60)}:${(seconds%60).toFixed(3).padStart(6,'0')}`;
}
