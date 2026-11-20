export const sessionNames = { 'Practice 1': 'Libres 1', 'Practice 2': 'Libres 2', 'Practice 3': 'Libres 3', Qualifying: 'Clasificación', 'Sprint Qualifying': 'Clasificación sprint', Sprint: 'Sprint', Race: 'Carrera' };
export function historicalSession(session, now = new Date()) {
  return !session.is_cancelled && Number.isFinite(Date.parse(session.date_end)) && Date.parse(session.date_end) + 30 * 60_000 <= now.getTime();
}
export function normalizeSession(meta, drivers, results, laps, note) {
  const key = meta.session_key;
  if (!Number.isInteger(key) || !Array.isArray(drivers) || drivers.length < 15 || !Array.isArray(laps)) throw new Error('Sesión incompleta.');
  if(!Number.isFinite(Date.parse(meta.date_start)) || !Number.isFinite(Date.parse(meta.date_end)) || Date.parse(meta.date_end)<=Date.parse(meta.date_start))throw new Error('Horario de sesión inválido.');
  const timeValue=(value)=>value===null || typeof value==='number' && Number.isFinite(value) && value>=0;
  if(drivers.some((driver)=>typeof driver.full_name!=='string' || !driver.full_name.trim() || typeof driver.team_name!=='string'))throw new Error('Identidad de piloto incompleta.');
  if(results.some((r)=>r.position!==null && (!Number.isInteger(r.position) || r.position<1) || r.duration!==null && r.duration!==undefined && !(Array.isArray(r.duration)?r.duration.every(timeValue):timeValue(r.duration))))throw new Error('Clasificación con valores inválidos.');
  for (const list of [drivers, results, laps]) if (list.some((row) => row.session_key !== key || !Number.isInteger(row.driver_number))) throw new Error('Datos de otra sesión.');
  const numbers = new Set(drivers.map((driver) => driver.driver_number));
  if (numbers.size !== drivers.length || results.some((row) => !numbers.has(row.driver_number)) || laps.some((row) => !numbers.has(row.driver_number))) throw new Error('Pilotos inconsistentes.');
  if (!note && (results.length < drivers.length || new Set(results.map((row) => row.driver_number)).size !== results.length)) throw new Error('Clasificación incompleta; se conserva la anterior.');
  if (!results.length && !note) throw new Error('Resultado pendiente de confirmación.');
  const seconds = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
  const result = {
    key, name: sessionNames[meta.session_name] ?? meta.session_name, startsAt: meta.date_start, endsAt: meta.date_end,
    year: meta.year, meetingKey: meta.meeting_key, circuit: meta.circuit_short_name,
    state: results.length ? 'classified' : 'no-timed-laps', ...(note ? { note } : {}),
    drivers: drivers.map((d) => ({ number: d.driver_number, name: d.full_name, code: d.name_acronym, team: d.team_name })),
    results: results.toSorted((a,b) => (a.position ?? 999) - (b.position ?? 999)).map((r) => ({ number:r.driver_number, position:r.position ?? null, laps:r.number_of_laps ?? null, duration:r.duration ?? null, gap:r.gap_to_leader ?? null, status:r.dsq ? 'DSQ' : r.dns ? 'DNS' : r.dnf ? 'DNF' : '' })),
    laps: laps.map((lap) => ({ driver:lap.driver_number, number:lap.lap_number, startsAt:lap.date_start ?? null, duration:seconds(lap.lap_duration), sectors:[seconds(lap.duration_sector_1),seconds(lap.duration_sector_2),seconds(lap.duration_sector_3)], pitOut:lap.is_pit_out_lap === true })),
  };
  if (result.laps.some((lap) => !Number.isInteger(lap.number) || lap.number < 1 || lap.startsAt && !Number.isFinite(Date.parse(lap.startsAt)))) throw new Error('Vueltas inválidas.');
  return result;
}
