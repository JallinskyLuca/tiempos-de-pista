import { getF1Session } from '@/lib/openf1';
import { normalizeTelemetry, telemetryQuery, telemetryWindow } from '@/lib/telemetry';
import { unstable_cache } from 'next/cache';

// Cola por instancia y caché de Next + CDN. Los fallos nunca se cachean como telemetría válida.
let queue = Promise.resolve();
let nextRequest = 0;
const inFlight = new Map<string,Promise<unknown>>();
const error = (message:string, status:number) => Response.json({ error:message }, { status, headers:{'Cache-Control':'no-store'} });
class TelemetryFailure extends Error { constructor(message:string,public status:number){super(message);} }
const readTelemetry=unstable_cache(async(providerUrl:string,from:string,key:number,driver:number)=>{
  const task=queue.then(async()=>{
    await new Promise((resolve)=>setTimeout(resolve,Math.max(0,nextRequest-Date.now())));
    nextRequest=Date.now()+2200;
    const response=await fetch(providerUrl,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
    if(response.status===404)throw new TelemetryFailure('La fuente no tiene muestras de telemetría para esta vuelta. Probá otra vuelta del piloto.',404);
    if(!response.ok)throw new Error('Fuente demorada.');
    const chunks:Uint8Array[]=[];let size=0;
    const reader=response.body!.getReader();
    for(;;){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();throw new Error('Respuesta demasiado grande.');}chunks.push(value);}
    const rows:unknown=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!Array.isArray(rows)||rows.length>5000)throw new Error('Respuesta inválida.');
    if(rows.some((row)=>!row||typeof row!=='object'||row.session_key!==key||row.driver_number!==driver))throw new Error('Datos de otra sesión o piloto.');
    const points=normalizeTelemetry(rows,from);
    if(!points.length)throw new Error('Sin muestras disponibles.');
    return points;
  });
  queue=task.then(()=>undefined,()=>undefined);
  return task;
},['openf1-validated-telemetry-v1'],{revalidate:86400});
export async function GET(request:Request, { params }:{params:Promise<{session:string}>}) {
  const { session:key } = await params;
  const url = new URL(request.url);
  const driver = url.searchParams.get('piloto') ?? '';
  const number = url.searchParams.get('vuelta') ?? '';
  if (!/^\d{1,6}$/.test(key) || !/^\d{1,3}$/.test(driver) || !/^\d{1,3}$/.test(number) || [...url.searchParams.keys()].some((name)=>!['piloto','vuelta'].includes(name))) return error('Consulta inválida.',400);
  const session = await getF1Session(Number(key));
  if (!session || Date.parse(session.endsAt)+30*60_000 > Date.now()) return error('La sesión histórica todavía no está disponible.',404);
  const lap = session.laps.find((lap) => lap.driver === Number(driver) && lap.number === Number(number));
  const window = lap && telemetryWindow(session,lap);
  if (!window) return error('No hay un intervalo de telemetría para esa vuelta.',404);
  const query = telemetryQuery(Number(key),Number(driver),window);
  const providerUrl = `https://api.openf1.org/v1/car_data?${query}`;
  try {
    let pending = inFlight.get(providerUrl);
    if (!pending) {
      if (inFlight.size >= 2) return error('Hay muchas consultas. Volvé a intentar en unos segundos.',429);
      pending = readTelemetry(providerUrl,window.from,Number(key),Number(driver)).finally(()=>inFlight.delete(providerUrl));
      inFlight.set(providerUrl,pending);
    }
    return Response.json({points:await pending,window,source:'OpenF1',session:Number(key),driver:Number(driver),lap:Number(number),publishedAt:session.publishedAt},{headers:{'Cache-Control':'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'}});
  } catch(failure) { return error(failure instanceof TelemetryFailure?failure.message:'No se pudo obtener la telemetría. Conservá esta sesión y volvé a intentar más tarde.',failure instanceof TelemetryFailure?failure.status:503); }
}
