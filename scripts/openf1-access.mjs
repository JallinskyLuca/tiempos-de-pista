export function freeAccessWindow(events,now=new Date()) {
  const instant=now.getTime();
  for(const event of events)for(const[name,start]of event.schedule??[]){
    const duration=/carrera/i.test(name)?180:/clasificaci[oó]n.*sprint/i.test(name)?45:60;
    const from=Date.parse(start)-30*60_000,to=Date.parse(start)+(duration+30)*60_000;
    if(instant>=from && instant<=to)return {allowed:false,retryAt:new Date(to).toISOString()};
  }
  return {allowed:true};
}
