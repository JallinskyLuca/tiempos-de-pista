'use client';

import { useState } from 'react';
import { toggleFavorite, useFavorites, type FavoriteEvent } from '@/lib/favorites';
import { saveEvent, type SavedEvent } from '@/lib/saved-events';

export function EventActions({ event, hasResults = false }: { event: FavoriteEvent; hasResults?: boolean }) {
  const favorites = useFavorites();
  const selected = favorites.some((favorite) => favorite.key === event.key);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    setStatus('Guardando la fecha completa…');
    try {
      if (process.env.NODE_ENV === 'production') {
        if (!('serviceWorker' in navigator)) throw new Error('Este navegador no habilitó la lectura sin conexión.');
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('Todavía no se pudo preparar la lectura sin conexión. Mantené la página abierta y volvé a intentar.')), 20000);
          void navigator.serviceWorker.ready.then(() => { window.clearTimeout(timeout); resolve(); }).catch((error) => { window.clearTimeout(timeout); reject(error); });
        });
      }
      const response = await fetch(`/api/fechas/${event.category}/${event.year}/${event.id}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('No se pudo descargar la fecha. Volvé a intentar con conexión.');
      const data: SavedEvent = await response.json();
      if (data.key !== event.key || !Array.isArray(data.event?.tables) || !data.revision) throw new Error('La descarga está incompleta.');
      await saveEvent({ ...data, savedAt: new Date().toISOString() });
      setStatus('Fecha guardada. Encontrala en Mi app.');
    } catch (error) {
      setStatus(error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'La descarga tardó demasiado. Volvé a intentar.');
    } finally { setBusy(false); }
  }

  function favorite() {
    try { toggleFavorite(event, favorites); } catch { setStatus('El navegador no pudo guardar el favorito.'); }
  }

  return (
    <div className="event-actions">
      {hasResults ? <a className="button-primary" href="#resultado">Ver resultados</a> : null}
      <button type="button" aria-pressed={selected} onClick={favorite}>{selected ? '★ En favoritos' : '☆ Seguir fecha'}</button>
      <button type="button" onClick={download} disabled={busy}>{busy ? 'Guardando…' : 'Guardar sin conexión'}</button>
      <a href={`/api/fechas/${event.category}/${event.year}/${event.id}/calendario`}>Agregar al calendario</a>
      <p role="status">{status}</p>
    </div>
  );
}
