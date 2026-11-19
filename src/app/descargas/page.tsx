'use client';

import { useEffect, useState } from 'react';
import { listSavedEvents, removeSavedEvent, type SavedEvent } from '@/lib/saved-events';
import { categories, formatDate } from '@/lib/racing';
import { usePwaInstall } from '@/lib/pwa-install';

export default function DownloadsPage() {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [status, setStatus] = useState('Cargando tus descargas…');
  const { prompt, installed, install } = usePwaInstall();

  useEffect(() => {
    void listSavedEvents().then((events) => { setEvents(events); setStatus(''); }).catch(() => setStatus('El navegador no permitió acceder a las descargas.'));
  }, []);

  async function remove(key: string) {
    try { await removeSavedEvent(key); setEvents(await listSavedEvents()); setStatus('Descarga eliminada.'); }
    catch { setStatus('No se pudo eliminar la descarga.'); }
  }

  return (
    <>
      <header className="edition-heading"><h1>Tu app de pista</h1><p>Llevá los resultados con vos, incluso donde falta señal.</p></header>
      <section className="panel install-panel">
        <div className="section-heading"><h2>{installed ? 'Tiempos de Pista instalada' : 'Instalar en el teléfono'}</h2></div>
        {!installed ? <div className="empty">
          {prompt ? <button className="primary-button" onClick={() => void install().catch(() => setStatus('No se pudo iniciar la instalación. Intentá desde el menú del navegador.'))} type="button">Instalar Tiempos de Pista</button> : <p>En Android, abrí el menú del navegador y elegí “Instalar aplicación”. En iPhone, usá Compartir y “Agregar a inicio”.</p>}
          <p>Guardá una fecha desde su ficha y abrí la lectura sin conexión antes de salir.</p>
        </div> : <p className="empty">Podés abrirla desde el inicio de tu teléfono.</p>}
      </section>
      <section className="panel event-schedule">
        <div className="section-heading"><h2>Fechas descargadas</h2><span className="section-meta">{events.length} de 20</span></div>
        <p role="status" className="empty">{status || (events.length ? 'Guardadas en este dispositivo. Podés actualizarlas desde la ficha de cada fecha.' : 'Elegí “Guardar sin conexión” en una fecha para traer sus tablas completas acá.')}</p>
        <ul className="favorite-list">
          {events.map((saved) => <li key={saved.key}><a href={`/offline.html?fecha=${encodeURIComponent(saved.key)}`}><strong>{saved.event.name}</strong><span>{categories[saved.category].short} · {saved.year} · Guardada el {formatDate(saved.savedAt)}</span></a><button type="button" onClick={() => remove(saved.key)}>Eliminar</button></li>)}
        </ul>
        <a className="source" href="/offline.html">Abrir lectura sin conexión</a>
      </section>
    </>
  );
}
