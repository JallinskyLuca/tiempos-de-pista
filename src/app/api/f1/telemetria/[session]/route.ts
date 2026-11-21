import {getF1Session} from '@/lib/openf1';
import {getTelemetryArchive} from '@/lib/telemetry-archive';
const error=(message:string,status:number)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request,{params}:{params:Promise<{session:string}>}){
  const{session:key}=await params;const url=new URL(request.url);
  const driver=url.searchParams.get('piloto')??'',lap=url.searchParams.get('vuelta')??'';
  if(!/^\d{1,6}$/.test(key)||!/^\d{1,3}$/.test(driver)||!/^\d{1,3}$/.test(lap)||[...url.searchParams.keys()].some(name=>!['piloto','vuelta'].includes(name)))return error('Consulta inválida.',400);
  const session=await getF1Session(Number(key));
  if(!session||!session.laps.some(item=>item.driver===Number(driver)&&item.number===Number(lap)))return error('Vuelta desconocida.',404);
  const index=await getTelemetryArchive();
  const entry=index.laps[`${Number(key)}:${Number(driver)}:${Number(lap)}`];
  if(!entry||!/^\/telemetria\/[a-f\d]{64}\.json$/.test(entry.file))return error('La telemetría de esta vuelta todavía no está sincronizada. Se incorpora automáticamente cuando OpenF1 vuelve a permitir el acceso gratuito.',409);
  return new Response(null,{status:307,headers:{Location:new URL(entry.file,url.origin).toString(),'Cache-Control':'public, max-age=300, s-maxage=300'}});
}
