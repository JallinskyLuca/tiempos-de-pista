import {expect,it} from 'vitest';
import {historicalSession,normalizeSession} from '../scripts/openf1-model.mjs';
const meta={session_key:11414,session_name:'Practice 2',date_start:'2026-11-20T04:00Z',date_end:'2026-11-20T05:00Z',year:2026};
const drivers=Array.from({length:22},(_,i)=>({session_key:11414,driver_number:i+1,full_name:`Piloto ${i+1}`,name_acronym:`P${i+1}`,team_name:'Equipo'}));
const results=drivers.map((d,i)=>({...d,position:i+1,number_of_laps:23,duration:107.272+i,gap_to_leader:i}));
it('solo consulta sesiones finalizadas fuera de la ventana gratuita restringida',()=>{
  expect(historicalSession(meta,new Date('2026-11-20T05:29Z'))).toBe(false);
  expect(historicalSession(meta,new Date('2026-11-20T05:30Z'))).toBe(true);
  expect(historicalSession({...meta,is_cancelled:true},new Date('2026-11-21'))).toBe(false);
});
it('rechaza resultados parciales y datos de otra sesión',()=>{
  expect(()=>normalizeSession(meta,drivers,results.slice(0,5),[])).toThrow(/incompleta/);
  expect(()=>normalizeSession(meta,drivers,[...results.slice(0,-1),{...results[21],session_key:99}],[])).toThrow(/otra sesión/);
  expect(normalizeSession(meta,drivers,results,[]).results).toHaveLength(22);
  expect(()=>normalizeSession(meta,drivers,[{...results[0],duration:-1},...results.slice(1)],[])).toThrow(/valores inválidos/);
});
it('un 404 no acredita por sí solo que no hubo vueltas cronometradas',()=>{
  expect(()=>normalizeSession(meta,drivers,[],[])).toThrow();
  const session=normalizeSession(meta,drivers,[],[{session_key:11414,driver_number:1,lap_number:1,date_start:'2026-11-20T04:10Z',lap_duration:1867.424,is_pit_out_lap:true,duration_sector_1:null}],{text:'Confirmación oficial',source:'https://www.formula1.com/'});
  expect(session.state).toBe('no-timed-laps');expect(session.results).toHaveLength(0);expect(session.laps[0].pitOut).toBe(true);
});
