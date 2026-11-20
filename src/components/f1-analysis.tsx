'use client';

import { useEffect, useRef, useState } from 'react';
import { lapTime, type F1Session, type SessionLap } from '@/lib/openf1-format';
import type { TelemetryPoint } from '@/lib/telemetry';

type Sample = { points:TelemetryPoint[]; window:{from:string;to:string;truncated:boolean} };
const usableLaps = (session:F1Session, driver:number) => session.laps.filter((lap)=>lap.driver===driver && lap.startsAt);
function bestLap(laps:SessionLap[]) { return laps.filter((lap)=>lap.duration && !lap.pitOut && lap.sectors.every((value)=>value!==null)).toSorted((a,b)=>a.duration!-b.duration!)[0] ?? laps[0]; }

function TelemetryChart({ data, comparison, field, title, max, unit }:{data:Sample;comparison:Sample|null;field:'speed'|'throttle'|'brake'|'rpm'|'gear';title:string;max:number;unit:string}) {
  const width=760,height=160, duration=Math.max(data.points.at(-1)?.t ?? 1,comparison?.points.at(-1)?.t ?? 1);
  const path = (sample:Sample) => { let drawing=false; return sample.points.map((point)=>{ const value=point[field]; if(value===null){drawing=false;return '';} const segment=`${drawing?'L':'M'}${(45+point.t/duration*(width-60)).toFixed(1)},${(height-25-value/max*(height-40)).toFixed(1)}`;drawing=true;return segment; }).join(' '); };
  return <figure className="telemetry-chart"><figcaption>{title}<span>Escala: 0–{max} {unit}</span></figcaption><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${title} por segundos transcurridos; valores disponibles en la tabla de muestras`}><path d={`M45 15V${height-25}H${width-15}`} fill="none" stroke="var(--control-border)" vectorEffect="non-scaling-stroke"/><path d={path(data)} fill="none" stroke="var(--blue)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>{comparison?<path d={path(comparison)} fill="none" stroke="var(--amber)" strokeDasharray="6 3" strokeWidth="2" vectorEffect="non-scaling-stroke"/>:null}</svg><div className="chart-time-axis"><span>0 s</span><span>{duration.toFixed(1)} s</span></div></figure>;
}

export function F1Analysis({ session }:{session:F1Session}) {
  const first=session.results[0]?.number ?? session.drivers.find((driver)=>session.laps.some((lap)=>lap.driver===driver.number))?.number ?? session.drivers[0].number;
  const [driver,setDriver]=useState(first),[lap,setLap]=useState(bestLap(usableLaps(session,first))?.number ?? 1);
  const [other,setOther]=useState(0),[otherLap,setOtherLap]=useState(1);
  const [data,setData]=useState<Sample|null>(null),[comparison,setComparison]=useState<Sample|null>(null);
  const [status,setStatus]=useState(''),[busy,setBusy]=useState(false);
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  function invalidate() { controller.current?.abort();setBusy(false);setData(null);setComparison(null);setStatus(''); }
  function chooseDriver(value:number, compare=false) {
    const number=bestLap(usableLaps(session,value))?.number ?? 1;
    invalidate();
    if(compare){setOther(value);setOtherLap(number);}else{setDriver(value);setLap(number);}
  }
  async function load() {
    controller.current?.abort();const active=new AbortController();controller.current=active;
    setBusy(true);setStatus('Consultando telemetría de la sesión finalizada…');setData(null);setComparison(null);
    const read=async(number:number,lap:number):Promise<Sample>=>{const response=await fetch(`/api/f1/telemetria/${session.key}?piloto=${number}&vuelta=${lap}`,{signal:active.signal});const body=await response.json();if(!response.ok)throw new Error(body.error);return body;};
    try { const a=await read(driver,lap);const b=other?await read(other,otherLap):null;if(active.signal.aborted)return;setData(a);setComparison(b);setStatus('Telemetría cargada. El eje horizontal muestra segundos desde el inicio del intervalo.'); }
    catch(error){if(!active.signal.aborted)setStatus(error instanceof Error?error.message:'No se pudo cargar la telemetría.');}
    finally{if(!active.signal.aborted)setBusy(false);}
  }
  const selected=usableLaps(session,driver).find((item)=>item.number===lap);
  return <section className="panel f1-analysis" aria-labelledby="telemetria-titulo">
    <div className="section-heading"><h2 id="telemetria-titulo">Telemetría · {session.name}</h2><span className="section-meta">Sesión finalizada</span></div>
    <div className="analysis-body"><p>Velocidad, acelerador, freno, marcha y RPM. Elegí una vuelta para consultar sus muestras; podés compararla con otro piloto.</p>
      <div className="telemetry-controls"><label>Piloto<select aria-label="Piloto de telemetría" value={driver} onChange={(e)=>chooseDriver(Number(e.target.value))}>{session.drivers.map((d)=><option value={d.number} key={d.number}>{d.number} · {d.name}</option>)}</select></label>
        <label>Vuelta<select aria-label="Vuelta" value={lap} onChange={(e)=>{invalidate();setLap(Number(e.target.value));}}>{usableLaps(session,driver).map((l)=><option value={l.number} key={l.number}>{l.number} · {lapTime(l.duration)}{l.pitOut?' · salida de boxes':''}</option>)}</select></label>
        <label>Comparar con<select aria-label="Comparar con" value={other} onChange={(e)=>chooseDriver(Number(e.target.value),true)}><option value={0}>Sin comparación</option>{session.drivers.map((d)=><option value={d.number} key={d.number}>{d.number} · {d.name}</option>)}</select></label>
        {other?<label>Vuelta a comparar<select aria-label="Vuelta a comparar" value={otherLap} onChange={(e)=>{invalidate();setOtherLap(Number(e.target.value));}}>{usableLaps(session,other).map((l)=><option key={l.number} value={l.number}>{l.number} · {lapTime(l.duration)}</option>)}</select></label>:null}
      </div>
      {selected?<p className="lap-sectors">S1: {lapTime(selected.sectors[0])} · S2: {lapTime(selected.sectors[1])} · S3: {lapTime(selected.sectors[2])}{selected.pitOut?' · Vuelta de salida de boxes':''}</p>:null}
      <button className="button button-primary" disabled={busy || !selected} onClick={load}>{busy?'Cargando…':'Cargar telemetría'}</button><p role="status">{status}</p>
      {data?<><p className="telemetry-legend">Línea continua: auto {driver}, vuelta {lap}.{comparison?` Línea punteada: auto ${other}, vuelta ${otherLap}.`:''} Comparación por tiempo transcurrido, sin alinear por distancia.</p>{data.window.truncated || comparison?.window.truncated?<p>Para vueltas de más de tres minutos se muestran los últimos 180 segundos disponibles.</p>:null}
        <TelemetryChart data={data} comparison={comparison} field="speed" title="Velocidad" max={400} unit="km/h"/><TelemetryChart data={data} comparison={comparison} field="throttle" title="Acelerador" max={100} unit="%"/><TelemetryChart data={data} comparison={comparison} field="brake" title="Freno" max={100} unit="%"/><TelemetryChart data={data} comparison={comparison} field="gear" title="Marcha" max={8} unit=""/><TelemetryChart data={data} comparison={comparison} field="rpm" title="Motor" max={16000} unit="RPM"/>
        <details><summary>Ver todas las muestras del piloto principal ({data.points.length})</summary><div className="table-scroll" role="region" aria-label="Muestras de telemetría" tabIndex={0}><table><thead><tr>{['Segundo','km/h','Acelerador %','Freno %','Marcha','RPM'].map((label)=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{data.points.map((p,index)=><tr key={index}>{[p.t.toFixed(2),p.speed,p.throttle,p.brake,p.gear,p.rpm].map((value,i)=><td key={i}>{value??'—'}</td>)}</tr>)}</tbody></table></div></details></>:null}
      <p className="content-note">Fuente: <a href="https://openf1.org/docs/" target="_blank" rel="noreferrer">OpenF1</a>. Importado el {new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'short',timeStyle:'short'}).format(new Date(session.publishedAt))}. Los valores ausentes o inválidos se muestran como faltantes. La telemetría requiere conexión y no es en vivo.</p>
    </div>
  </section>;
}
