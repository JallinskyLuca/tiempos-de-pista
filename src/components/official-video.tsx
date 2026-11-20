'use client';

import { useState } from 'react';
import type { OfficialVideo } from '@/lib/content';
import { categories, formatDate } from '@/lib/racing';

export function OfficialVideoPlayer({ video }: { video: OfficialVideo }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="video-player" data-category={video.category}>
      {loaded ? <iframe src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`} title={video.title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : (
        <div className="video-cover">
          <span className="video-session">{categories[video.category].short} · {video.year}</span>
          <strong>{video.title}</strong>
          <button className="button button-primary" onClick={() => setLoaded(true)} aria-label={`Cargar video: ${video.title}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 4 13 8-13 8Z" /></svg>Cargar video</button>
          <small>Se conectará con YouTube. Publicado el {formatDate(video.publishedAt)}.</small>
        </div>
      )}
      {loaded ? <button className="video-close" onClick={() => setLoaded(false)}>Cerrar reproductor</button> : null}
    </div>
  );
}
