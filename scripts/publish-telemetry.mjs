import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory=new URL('../public/telemetria/',import.meta.url);
export async function publishTelemetry({session,driver,lap,points,window,capturedAt,provenance}){
  if(!Number.isInteger(session)||!Number.isInteger(driver)||!Number.isInteger(lap)||!points.length||points.length>5000)throw new Error('Muestras de telemetría inválidas.');
  const body={session,driver,lap,source:'OpenF1',capturedAt,window,points,...(provenance?{provenance}:{})};
  const content=JSON.stringify(body),hash=createHash('sha256').update(content).digest('hex');
  await mkdir(directory,{recursive:true});
  const file=new URL(`${hash}.json`,directory);
  let previous;try{previous=await readFile(file,'utf8');}catch{}
  if(previous!==content)await writeFile(file,content);
  return {file:`/telemetria/${hash}.json`,samples:points.length,capturedAt};
}
