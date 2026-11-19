'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFavorites, toggleFavorite } from '@/lib/favorites';
import { categories, formatDate } from '@/lib/racing';

export default function FavoritesPage() {
  const favorites = useFavorites();
  const [status, setStatus] = useState('');
  function remove(event: Parameters<typeof toggleFavorite>[0]) {
    try { toggleFavorite(event, favorites); setStatus('Fecha quitada de favoritos.'); }
    catch { setStatus('El navegador no pudo actualizar tus favoritos.'); }
  }
  return (
    <>
      <header className="edition-heading"><h1>Tus favoritos</h1><p>Las fechas que querés tener a mano, guardadas en este dispositivo.</p></header>
      <p role="status">{status}</p>
      {favorites.length ? (
        <ul className="panel favorite-list">
          {favorites.map((event) => (
            <li key={event.key}><Link href={`/categoria/${event.category}/archivo/${event.year}/${event.id}`}><strong>{event.name}</strong><span>{categories[event.category].short} · {formatDate(event.date)} {event.year}</span></Link><button type="button" onClick={() => remove(event)} aria-label={`Quitar ${event.name} de favoritos`}>Quitar</button></li>
          ))}
        </ul>
      ) : <div className="panel empty-state"><h2>Elegí tu próxima fecha</h2><p>Usá “Seguir fecha” en una carrera para encontrarla acá.</p><Link href="/archivo">Explorar el archivo</Link></div>}
    </>
  );
}
