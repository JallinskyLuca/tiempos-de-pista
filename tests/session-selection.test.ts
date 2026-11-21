import {expect,it} from 'vitest';
import {selectSession,sessionOptionValue} from '../src/lib/session-selection';
it('mantiene FP2 aunque se incorpore FP3 al principio de la lista',()=>{
  const old=[{index:0,table:{id:'openf1:11414'}},{index:1,table:{id:'openf1:11413'}}];
  const updated=[{index:0,table:{id:'openf1:11415'}},...old.map(session=>({...session,index:session.index+1}))];
  expect(selectSession(old,'openf1:11414')?.table.id).toBe('openf1:11414');
  expect(selectSession(updated,'openf1:11414')?.table.id).toBe('openf1:11414');
  expect(sessionOptionValue({index:1,id:'openf1:11414'})).toBe('openf1:11414');
  expect(selectSession(updated,'2')?.table.id).toBe('openf1:11413');
});
