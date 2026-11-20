'use client';

import { useSyncExternalStore } from 'react';
const key='tiempos-theme-v1';
function apply(theme:string) {
  document.documentElement.dataset.theme=theme==='light'?'light':'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f1f5fa':'#101722');
}
function subscribe(callback:()=>void) {
  const changed=()=>callback();
  const storage=(event:StorageEvent)=>{if(event.key===key){apply(event.newValue??'dark');callback();}};
  window.addEventListener('tiempos-theme',changed);window.addEventListener('storage',storage);
  return ()=>{window.removeEventListener('tiempos-theme',changed);window.removeEventListener('storage',storage);};
}
export function ThemeToggle() {
  const theme=useSyncExternalStore(subscribe,()=>document.documentElement.dataset.theme??'dark',()=> 'dark');
  function toggle(){const value=theme==='dark'?'light':'dark';apply(value);try{localStorage.setItem(key,value);}catch{}window.dispatchEvent(new Event('tiempos-theme'));}
  return <button className="theme-toggle button" onClick={toggle} aria-label={theme==='dark'?'Usar modo claro':'Usar modo oscuro'} title={theme==='dark'?'Usar modo claro':'Usar modo oscuro'}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{theme==='dark'?<><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>:<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>}</svg><span>{theme==='dark'?'Claro':'Oscuro'}</span></button>;
}
