type Option = { index:number; id?:string };
export function sessionOptionValue(option:Option) {
  return option.id && /^openf1:\d+$/.test(option.id) ? option.id : String(option.index);
}
export function selectSession<T extends { index:number; table:{id?:string} }>(sessions:T[],value:unknown):T|undefined {
  if(typeof value==='string') {
    const found=/^openf1:\d+$/.test(value)
      ? sessions.find(session=>session.table.id===value)
      : /^\d+$/.test(value)?sessions.find(session=>session.index===Number(value)):undefined;
    if(found)return found;
  }
  return sessions[0];
}
