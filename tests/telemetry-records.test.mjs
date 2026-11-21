import {expect,it} from 'vitest';
import {prepareDriverLaps} from '../scripts/telemetry-records.mjs';
const session={key:11414,startsAt:'2026-11-20T04:00:00Z',endsAt:'2026-11-20T05:00:00Z',laps:[{driver:63,number:1,startsAt:'2026-11-20T04:10:00Z',duration:60,sectors:[20,20,20],pitOut:false},{driver:63,number:2,startsAt:'2026-11-20T04:11:00Z',duration:60,sectors:[20,20,20],pitOut:false}]};
const rows=[{session_key:11414,driver_number:63,date:'2026-11-20T04:10:10Z',speed:150,throttle:104},{session_key:11414,driver_number:63,date:'2026-11-20T04:11:20Z',speed:200}];
it('divide telemetría de un piloto en copias por vuelta sin mezclar sus intervalos',()=>{
  const laps=prepareDriverLaps(session,63,rows);
  expect(laps.map(l=>[l.lap,l.points.length,l.points[0].speed])).toEqual([[1,1,150],[2,1,200]]);
  expect(laps[0].points[0].throttle).toBeNull();
});
it('no publica respuestas vacías ni de otra sesión',()=>{
  expect(()=>prepareDriverLaps(session,63,[])).toThrow();
  expect(()=>prepareDriverLaps(session,10,rows)).toThrow();
});
