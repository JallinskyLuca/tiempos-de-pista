import {expect,it} from 'vitest';
import {orderCalendar} from '../src/lib/calendar-order';
it('pone la fecha del fin de semana primero y luego las restantes en orden descendente',()=>{
  const events=[{id:'20',date:'2026-11-08',round:20,name:'Brasil',source:'',tables:[]},{id:'21',date:'2026-11-22',round:21,name:'Vegas',source:'',tables:[]},{id:'22',date:'2026-11-29',round:22,name:'Qatar',source:'',tables:[]},{id:'23',date:'2026-12-06',round:23,name:'Abu Dhabi',source:'',tables:[]}];
  expect(orderCalendar(events,new Date('2026-11-20T23:00Z')).events.map((e)=>e.id)).toEqual(['21','23','22','20']);
  expect(orderCalendar(events,new Date('2026-12-10T12:00Z')).events.map((e)=>e.id)).toEqual(['23','22','21','20']);
});
