import AxeBuilder from '@axe-core/playwright';
import {expect,test} from '@playwright/test';

test('Las Vegas muestra FP2 completa y distingue FP1 sin tiempos oficiales',async({page,request})=>{
  await page.goto('/categoria/f1/archivo/2026/21');
  await expect(page.locator('#resultado h2')).toHaveText('Libres 2 · OpenF1');
  await expect(page.locator('#resultado tbody tr')).toHaveCount(22);
  await expect(page.locator('#resultado tbody tr').first()).toContainText(/Russell/i);
  const saved=await request.get('/api/fechas/f1/2026/21').then((r)=>r.json());
  expect(saved.event.tables.find((t:{id:string})=>t.id==='openf1:11414').rows).toHaveLength(22);
  await page.getByLabel('Elegí una sesión o estadística').selectOption({label:'Libres 1 · Estado'});
  await expect(page.locator('#resultado')).toContainText('sin vueltas cronometradas oficiales');
  await expect(page.getByRole('heading',{name:'Telemetría · Libres 1'})).toBeVisible();
  expect((await request.get('/api/f1/telemetria/11414?piloto=999&vuelta=1')).status()).toBe(404);
  expect((await request.get('/api/f1/telemetria/11414?piloto=63&vuelta=2&url=https://example.com')).status()).toBe(400);
});

test('telemetría bajo demanda, comparación y cancelación al cambiar vuelta',async({page})=>{
  let calls=0;
  await page.route('**/api/f1/telemetria/**',async(route)=>{
    calls++;
    await route.fulfill({json:{points:[{t:0,speed:100,throttle:50,brake:0,gear:3,rpm:7000},{t:1,speed:150,throttle:80,brake:null,gear:4,rpm:9000}],window:{from:'2026-11-20T04:10Z',to:'2026-11-20T04:11Z',truncated:false}}});
  });
  await page.goto('/categoria/f1/archivo/2026/21');
  await expect(page.getByRole('heading',{name:'Telemetría · Libres 2'})).toBeVisible();
  expect(calls).toBe(0);
  await page.getByLabel('Comparar con',{exact:true}).selectOption('10');
  await page.getByRole('button',{name:'Cargar telemetría'}).click();
  await expect(page.locator('.telemetry-chart')).toHaveCount(5);
  expect(calls).toBe(2);
  await page.getByText(/Ver todas las muestras/).click();
  await expect(page.locator('.f1-analysis table tbody tr')).toHaveCount(2);
  await page.getByLabel('Vuelta',{exact:true}).selectOption('2');
  await expect(page.locator('.telemetry-chart')).toHaveCount(0);
});

test('tema claro persiste, logos actuales y calendario destacado son accesibles',async({page},testInfo)=>{
  if(testInfo.project.name==='mobile')await page.setViewportSize({width:360,height:800});
  await page.goto('/categoria/f1/archivo/2026?vista=escuderias');
  await expect(page.locator('.team-card .team-logo img')).toHaveCount(11);
  for(const image of await page.locator('.team-card .team-logo img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((node)=>(node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth>0)).toBe(true);}
  await page.getByRole('button',{name:'Usar modo claro'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  for(const path of ['/categoria/f1/archivo/2026?vista=escuderias','/categoria/f1/archivo/2026/21','/','/descargas','/apoyar']){
    await page.goto(path);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;
    expect(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),path).toEqual([]);
  }
  await page.goto('/categoria/f1/archivo/2026');
  const rounds=await page.locator('.round-number').allTextContents();
  const featured=page.locator('.calendar-featured');
  if(await featured.count())expect(await featured.locator('.round-number').textContent()).toBe(rounds[0]);
  const rest=rounds.slice(await featured.count()).map(Number);
  expect(rest).toEqual([...rest].sort((a,b)=>b-a));
  await page.screenshot({path:`.work-import/previews/${testInfo.project.name}/calendario-claro-v1.1.png`,fullPage:true});
});

test('Wake Lock se libera al salir y permite reintentar ante rechazo',async({page})=>{
  await page.addInitScript(()=>{
    const state={requests:0,releases:0,fail:false};
    Object.assign(window,{wakeTest:state});
    Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{
      state.requests++;if(state.fail)throw new Error('Battery');
      const lock=new EventTarget() as EventTarget & {released:boolean;release:()=>Promise<void>};lock.released=false;
      lock.release=async()=>{if(!lock.released){lock.released=true;state.releases++;lock.dispatchEvent(new Event('release'));}};
      return lock;
    }}});
  });
  await page.goto('/categoria/f1/archivo/2026/21');
  await page.getByRole('button',{name:'Mantener pantalla encendida',exact:true}).click();
  await expect(page.locator('.wake-indicator')).toHaveText('Activa');
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('.wake-indicator')).toHaveText('En pausa');
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('.wake-indicator')).toHaveText('Activa');
  expect(await page.evaluate(()=>(window as unknown as {wakeTest:{requests:number}}).wakeTest.requests)).toBe(2);
  await page.getByRole('link',{name:'Temporada 2026',exact:false}).click();
  await expect(page).toHaveURL(/\/categoria\/f1\/archivo\/2026$/);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {wakeTest:{releases:number}}).wakeTest.releases)).toBe(2);
  await page.goto('/categoria/f1/archivo/2026/21');
  await page.evaluate(()=>(window as unknown as {wakeTest:{fail:boolean}}).wakeTest.fail=true);
  await page.getByRole('button',{name:'Mantener pantalla encendida',exact:true}).click();
  await expect(page.locator('.wake-lock [role="status"]')).toContainText('no permitió');
});
