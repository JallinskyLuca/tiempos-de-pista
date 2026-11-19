'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function ResultsUpdates() {
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let revision: string | null = null;
    let running = false;
    const abort = new AbortController();
    async function check() {
      if (running || document.visibilityState !== 'visible' || !navigator.onLine) return;
      running = true;
      try {
        const response = await fetch('/api/actualizaciones', { cache: 'no-store', signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.revision !== 'string') return;
        if (revision && data.revision !== revision) setAvailable(true);
        revision = data.revision;
      } catch { /* Una falla de red no reemplaza los resultados visibles. */ }
      finally { running = false; }
    }
    void check();
    const timer = window.setInterval(() => void check(), 60000);
    const onVisible = () => void check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => { abort.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', onVisible); };
  }, []);
  if (!available) return null;
  return <div className="results-notice" role="status"><span>Hay resultados nuevos publicados.</span><button className="button button-primary" disabled={pending} type="button" onClick={() => startTransition(() => { router.refresh(); setAvailable(false); })}>{pending ? 'Cargando…' : 'Ver resultados nuevos'}</button></div>;
}
