import Link from 'next/link';
import { eventHref } from '@/lib/archive';
import { getNews, getVideos, officialChannels } from '@/lib/content';
import { categories, formatDate, type Category } from '@/lib/racing';
import { CategoryTag } from './racing-ui';
import { OfficialVideoPlayer } from './official-video';

export function NewsSection({ category }: { category?: Category }) {
  const items = getNews(category).slice(0, category ? 6 : 3);
  return (
    <section className="panel news-section" data-category={category} aria-labelledby="noticias-titulo">
      <div className="section-heading"><h2 id="noticias-titulo">Noticias de {category ? categories[category].short : 'pista'}</h2><span className="section-meta">Selección editorial</span></div>
      <div className="news-grid">
        {items.map((item) => <article key={item.slug} className="news-brief" data-category={item.category}>
          <div className="content-meta"><CategoryTag category={item.category} /><time dateTime={item.publishedAt}>{formatDate(item.publishedAt)} {item.publishedAt.slice(0, 4)}</time></div>
          <h3><Link href={`/noticias/${item.slug}`}>{item.title}</Link></h3><p>{item.summary}</p>
          <Link className="inline-link" href={`/noticias/${item.slug}`}>Leer breve</Link>
        </article>)}
        {!items.length ? <p className="empty">Todavía no hay noticias revisadas para esta categoría.</p> : null}
      </div>
    </section>
  );
}

export function VideoSection({ category, event }: { category?: Category; event?: { year: number; id: string } }) {
  const all = getVideos(category, event);
  // La portada representa todas las competencias; los centros muestran sus últimas sesiones.
  const videos = category ? all.slice(0, event ? 6 : 4) : (['f1', 'tc', 'tn'] as Category[]).flatMap((id) => all.filter((video) => video.category === id).slice(0, 1));
  if (event && !videos.length) return null;
  return (
    <section className="panel videos-section" aria-labelledby="videos-titulo">
      <div className="section-heading"><h2 id="videos-titulo">Resúmenes oficiales</h2><span className="section-meta">YouTube a pedido</span></div>
      <div className="video-grid">
        {videos.map((video) => <article className="video-card" key={video.id}>
          <OfficialVideoPlayer video={video} />
          <div className="video-description"><h3>{video.title}</h3><p><CategoryTag category={video.category} /> Canal <a href={officialChannels[video.category].url} target="_blank" rel="noreferrer">{officialChannels[video.category].name}</a></p>
            <div className="video-links">{video.eventId ? <Link href={eventHref(video.category, video.year, video.eventId)}>Ver fecha y resultados</Link> : null}<a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">Abrir en YouTube</a></div>
          </div>
        </article>)}
        {!videos.length ? <p className="empty">Todavía no hay un resumen oficial incorporado. Los nuevos videos se consultan automáticamente durante la actividad.</p> : null}
      </div>
      <p className="content-note">La reproducción depende de los permisos del canal y de tu región. Si no está disponible, podés abrir el video en YouTube.</p>
    </section>
  );
}
