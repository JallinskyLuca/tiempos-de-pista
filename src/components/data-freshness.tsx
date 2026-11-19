import Link from 'next/link';
import { getArchive, sources } from '@/lib/archive';
import { getSyncStatus } from '@/lib/sync-status';
import type { Category } from '@/lib/racing';

function stamp(value: string) {
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export async function DataFreshness({ category, year }: { category: Category; year?: string }) {
  const [archive, sync] = await Promise.all([getArchive(category), getSyncStatus()]);
  const entry = archive.seasons.find((entry) => String(entry.year) === year);
  const published = year ? entry?.updatedAt : archive.generatedAt;
  const check = sync.categories[category];
  return <aside className={`data-freshness${check?.state === 'error' ? ' source-delayed' : ''}`} aria-label="Fuente y actualización">
    <details><summary><strong>{archive.source?.name ?? sources[category].name}{archive.source?.version ? ` ${archive.source.version}` : ''}</strong><span>{check?.state === 'error' ? ' · Fuente demorada' : ' · Ver actualización'}</span></summary><div className="freshness-details"><div><span>{published ? <>Archivo publicado <time dateTime={published}>{stamp(published)}</time></> : 'Fecha de publicación sin registrar'}</span></div>
    <div><span>{check ? <>Consulta registrada <time dateTime={check.checkedAt}>{stamp(check.checkedAt)}</time></> : 'Consulta automática pendiente'}</span>{check?.state === 'error' ? <strong>Fuente demorada. Conservamos los resultados anteriores.</strong> : <span>Resultados sujetos a publicación y rectificaciones de la fuente.</span>}</div>
    <Link href="/cobertura">Ver cobertura</Link>
    </div></details>
  </aside>;
}
