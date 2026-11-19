'use client';

import { useEffect, useState } from 'react';
import { trackPwaInstall } from '@/lib/pwa-install';

export function PwaStatus() {
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const stopTracking = trackPwaInstall();
    const updateConnection = () => setOffline(!navigator.onLine);
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
          });
        });
      }).catch(() => { /* La lectura en línea sigue disponible cuando falla el registro. */ });
    }
    return () => { stopTracking(); window.removeEventListener('online', updateConnection); window.removeEventListener('offline', updateConnection); };
  }, []);

  function update() {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  return (
    <>
      {offline ? <div className="connection-notice" role="status">Sin conexión. <a href="/offline.html">Abrir fechas descargadas</a></div> : null}
      {waiting ? <div className="update-notice" role="status"><span>Hay una versión nueva de Tiempos de Pista.</span><button onClick={update} type="button">Actualizar</button><button onClick={() => setWaiting(null)} type="button">Más tarde</button></div> : null}
    </>
  );
}
