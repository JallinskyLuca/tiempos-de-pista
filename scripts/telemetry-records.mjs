import {normalizeTelemetry,telemetryWindow} from '../src/lib/telemetry.ts';
export function prepareDriverLaps(session,driver,rows){
  if(!Array.isArray(rows)||!rows.length||rows.length>100000||rows.some(row=>!row||row.session_key!==session.key||row.driver_number!==driver))throw new Error('Telemetría vacía o de otro piloto o sesión.');
  return session.laps.filter(lap=>lap.driver===driver && lap.startsAt).flatMap(lap=>{
    const window=telemetryWindow(session,lap);if(!window)return[];
    const points=normalizeTelemetry(rows,window.from).filter(point=>point.t<=(Date.parse(window.to)-Date.parse(window.from))/1000);
    return points.length?[{lap:lap.number,window,points}]:[];
  });
}
