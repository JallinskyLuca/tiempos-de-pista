import {expect,it} from 'vitest';
import {freeAccessWindow} from '../scripts/openf1-access.mjs';
const events=[{schedule:[['Libres 3','2026-11-21T00:30:00Z'],['Clasificación','2026-11-21T04:00:00Z']]}];
it('bloquea todas las consultas históricas dentro de cualquier ventana en vivo',()=>{
  expect(freeAccessWindow(events,new Date('2026-11-21T00:01Z')).allowed).toBe(false);
  expect(freeAccessWindow(events,new Date('2026-11-21T01:59Z')).allowed).toBe(false);
  expect(freeAccessWindow(events,new Date('2026-11-21T02:17Z')).allowed).toBe(true);
  expect(freeAccessWindow(events,new Date('2026-11-21T03:31Z')).allowed).toBe(false);
});
