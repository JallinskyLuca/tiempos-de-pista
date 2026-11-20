import {expect,it} from 'vitest';
import {normalizeTelemetry,telemetryQuery,telemetryWindow} from '../src/lib/telemetry';
it('construye comparadores compatibles con el contrato real de OpenF1',()=>{
  const query=telemetryQuery(11414,63,{from:'2026-11-20T04:10:00Z',to:'2026-11-20T04:10:05Z'});
  expect(query.get('date>')).toBe('2026-11-20T04:10:00Z');
  expect(query.has('date>=')).toBe(false);
  expect(query.toString()).toContain('date%3E=');
});
it('descarta valores centinela, ordena muestras y conserva faltantes',()=>{
  const rows=normalizeTelemetry([{date:'2026-11-20T04:10:01Z',speed:150,throttle:104,brake:104,n_gear:3,rpm:8000},{date:'2026-11-20T04:10:00Z',speed:0,throttle:0,brake:0}], '2026-11-20T04:10:00Z');
  expect(rows[0].t).toBe(0);expect(rows[1].throttle).toBeNull();expect(rows[1].brake).toBeNull();expect(rows[1].speed).toBe(150);
});
it('acota vueltas largas sin cortar la vuelta que termina después de la bandera',()=>{
  const meta={startsAt:'2026-11-20T04:00:00Z',endsAt:'2026-11-20T05:00:00Z'};
  const lap={driver:63,number:23,startsAt:'2026-11-20T04:59:00Z',duration:107.272,sectors:[30,40,37.272],pitOut:false};
  expect(telemetryWindow(meta,lap)?.to).toBe('2026-11-20T05:00:47.272Z');
  const long=telemetryWindow(meta,{...lap,startsAt:'2026-11-20T04:10:00Z',duration:1800});
  expect(Date.parse(long!.to)-Date.parse(long!.from)).toBe(180000);expect(long?.truncated).toBe(true);
});
