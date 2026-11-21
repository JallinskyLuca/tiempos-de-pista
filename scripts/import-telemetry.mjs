import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout} from 'node:timers/promises';
import {readPublished} from './published.mjs';
import {freeAccessWindow} from './openf1-access.mjs';
import {atomicJson} from './atomic-json.mjs';
import {publishTelemetry} from './publish-telemetry.mjs';
import {telemetryQuery} from '../src/lib/telemetry.ts';
import {prepareDriverLaps} from './telemetry-records.mjs';
const root=new URL('../data/openf1/',import.meta.url);
const now=new Date(),year=Number(new Intl.DateTimeFormat('en',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric'}).format(now));
const season=await readPublished('f1',year);
const access=freeAccessWindow(season?.events??[],now);
if(!access.allowed){console.log(`Telemetría: pausa global gratuita hasta ${access.retryAt}; se conservan las copias publicadas.`);process.exit(0);}
const index=JSON.parse(await readFile(new URL('index.json',root),'utf8'));
const previous=JSON.parse(await readFile(new URL('telemetry.json',root),'utf8'));
const drivers={...previous.drivers},laps={...previous.laps};
let nextRequest=0,changed=false;
for(const entry of index.sessions){
  const session=JSON.parse(await readFile(new URL(`sessions/${entry.file}.json`,root),'utf8'));
  for(const driver of session.drivers){
    const key=`${session.key}:${driver.number}`;
    const selected=session.laps.filter(lap=>lap.driver===driver.number && lap.startsAt);
    if(!selected.length || drivers[key]?.revision===entry.revision)continue;
    await setTimeout(Math.max(0,nextRequest-Date.now()));nextRequest=Date.now()+2200;
    const window={from:session.startsAt,to:new Date(Date.parse(session.endsAt)+15*60_000).toISOString()};
    const response=await fetch('https://api.openf1.org/v1/car_data?'+telemetryQuery(session.key,driver.number,window),{redirect:'error',signal:AbortSignal.timeout(30000)});
    if(response.status===401||response.status===429){console.log(`Telemetría: fuente restringida (HTTP ${response.status}); se conserva la publicación y se reintenta en otra ejecución.`);process.exit(0);}
    if(response.status===404)continue;
    if(!response.ok)throw new Error(`Telemetría HTTP ${response.status}; sin reemplazar el índice anterior.`);
    const chunks=[];let size=0;
    for await(const chunk of response.body){size+=chunk.byteLength;if(size>16_000_000)throw new Error('Telemetría demasiado grande.');chunks.push(chunk);}
    const rows=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const capturedAt=new Date().toISOString();
    let count=0;
    for(const {lap,window:range,points} of prepareDriverLaps(session,driver.number,rows)){
      const lapKey=`${key}:${lap}`;
      if(laps[lapKey] && points.length<laps[lapKey].samples)throw new Error('Se perdieron muestras publicadas; requiere revisión.');
      laps[lapKey]=await publishTelemetry({session:session.key,driver:driver.number,lap,points,window:range,capturedAt});count++;
    }
    if(!count)continue;
    drivers[key]={revision:entry.revision,capturedAt,laps:count};changed=true;
    await atomicJson(new URL('telemetry.json',root),{revision:createHash('sha256').update(JSON.stringify({drivers,laps})).digest('hex'),drivers,laps});
    console.log(`Telemetría ${session.key}, auto ${driver.number}: ${count} intervalos preparados.`);
  }
}
if(!changed)console.log('Telemetría: sin intervalos nuevos para preparar.');
