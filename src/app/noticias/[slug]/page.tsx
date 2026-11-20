import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNews } from '@/lib/content';
import { eventHref } from '@/lib/archive';
import { categories, formatDate } from '@/lib/racing';
import { CategoryNav } from '@/components/racing-ui';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getNews().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getNews().find((item) => item.slug === slug);
  return { title: item?.title ?? 'Noticia', description: item?.summary };
}
export default async function NewsPage({ params }: Props) {
  const { slug } = await params;
  const item = getNews().find((item) => item.slug === slug);
  if (!item) notFound();
  return <>
    <CategoryNav active={item.category} />
    <Link className="back-link" href={`/categoria/${item.category}`}>‹ {categories[item.category].name}</Link>
    <article className="news-article panel" data-category={item.category}>
      <header><p className="content-meta">{categories[item.category].name} · <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)} {item.publishedAt.slice(0, 4)}</time></p><h1>{item.title}</h1><p className="news-summary">{item.summary}</p></header>
      {item.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <p className="content-note">Breve de Tiempos de Pista a partir de información de <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceName}</a>. Consultá la fuente para la cobertura completa.</p>
      <div className="hub-actions">{item.eventId ? <Link className="button button-primary" href={eventHref(item.category, item.year, item.eventId)}>Ver fecha</Link> : null}<Link className="button" href={`/categoria/${item.category}`}>Más de {categories[item.category].short}</Link></div>
    </article>
  </>;
}
