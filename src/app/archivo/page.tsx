import Link from 'next/link';
import { connection } from 'next/server';
import { getArchive } from '@/lib/archive';
import { categories, type Category } from '@/lib/racing';
import { CategoryNav, CompetitionLogo } from '@/components/racing-ui';

export default async function ArchiveHome() {
  await connection();
  const archives = await Promise.all((Object.keys(categories) as Category[]).map(async (category) => ({ category, index: await getArchive(category) })));
  return (
    <>
      <CategoryNav />
      <header className="edition-heading"><h1>Archivo de pista</h1><p>Temporadas, resultados y campeonatos para recorrer la historia. <Link href="/cobertura">Ver fuentes y cobertura</Link></p></header>
      <div className="archive-stack">
        {archives.map(({ category, index }) => (
          <section className="panel" key={category}>
            <div className="section-heading"><h2><CompetitionLogo category={category} /> {categories[category].name}</h2><span className="section-meta">{index.seasons.length} temporadas</span></div>
            <p className="empty">Elegí una temporada. Cada fecha indica si tiene clasificaciones, ganador registrado u horarios pendientes.</p>
            <div className="year-grid">{index.seasons.map(({ year, results, rounds }) => <Link key={year} href={`/categoria/${category}/archivo/${year}`} prefetch={false}><strong>{year}</strong><small>{results} de {rounds} fechas con tablas</small></Link>)}</div>
          </section>
        ))}
      </div>
    </>
  );
}
