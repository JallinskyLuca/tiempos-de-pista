'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const subscribe=()=>()=>{};
export function WakeLockControl() {
  const supported=useSyncExternalStore(subscribe,()=>Boolean(window.isSecureContext && 'wakeLock' in navigator),()=>false);
  const [wanted,setWanted]=useState(false),[active,setActive]=useState(false),[message,setMessage]=useState('');
  const sentinel=useRef<WakeLockSentinel|null>(null);
  const generation=useRef(0);
  useEffect(()=>{
    if(!wanted || !supported)return;
    const current=++generation.current;
    let mounted=true;
    let requesting=false;
    async function acquire(){
      if(requesting || document.visibilityState!=='visible' || sentinel.current && !sentinel.current.released)return;
      requesting=true;
      try{
        const lock=await navigator.wakeLock.request('screen');
        if(!mounted || current!==generation.current || document.visibilityState!=='visible'){await lock.release();return;}
        sentinel.current=lock;setActive(true);setMessage('Pantalla encendida mientras esta página esté visible.');
        lock.addEventListener('release',()=>{if(mounted && current===generation.current && sentinel.current===lock){sentinel.current=null;setActive(false);setMessage('El dispositivo liberó la pantalla. Volvé a activar si hace falta.');}});
      }catch{if(mounted){setActive(false);setMessage('El dispositivo no permitió mantener la pantalla encendida. Podés volver a intentarlo.');setWanted(false);}}
      finally{requesting=false;}
    }
    function visibility(){if(document.visibilityState==='visible')void acquire();else{const lock=sentinel.current;sentinel.current=null;void lock?.release();setActive(false);setMessage('En pausa mientras la página no esté visible.');}}
    void acquire();document.addEventListener('visibilitychange',visibility);
    return()=>{mounted=false;document.removeEventListener('visibilitychange',visibility);const lock=sentinel.current;sentinel.current=null;void lock?.release();};
  },[wanted,supported]);
  function toggle(){if(wanted){setWanted(false);setActive(false);setMessage('Bloqueo de pantalla normal.');}else{setWanted(true);setMessage('Solicitando mantener la pantalla encendida…');}}
  return <div className="wake-lock"><button className="button" disabled={!supported} onClick={toggle} aria-pressed={wanted}>{wanted?'Desactivar pantalla encendida':'Mantener pantalla encendida'}</button><span className="wake-indicator">{active?'Activa':wanted?'En pausa':''}</span><p role="status">{supported?message:'Tu navegador no ofrece esta función. Podés ajustar el bloqueo automático del teléfono.'}</p></div>;
}
