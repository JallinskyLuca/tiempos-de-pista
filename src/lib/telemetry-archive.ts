import {cache} from 'react';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export type TelemetryArchive={revision:string;laps:Record<string,{file:string;samples:number;capturedAt:string}>};
export const getTelemetryArchive=cache(async():Promise<TelemetryArchive>=>JSON.parse(await readFile(join(process.cwd(),'data/openf1/telemetry.json'),'utf8')));
export async function availableTelemetry(session:number){
  const index=await getTelemetryArchive();
  return Object.keys(index.laps).filter(key=>key.startsWith(`${session}:`)).map(key=>{const[,driver,lap]=key.split(':').map(Number);return{driver,lap};});
}
