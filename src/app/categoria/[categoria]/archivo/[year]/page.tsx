import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArchiveNav, DataTable, SectionHero } from '@/components/archive-ui';
import { CategoryNav, RaceDate } from '@/components/racing-ui';
import { getArchive, getSeason, sources } from '@/lib/archive';
import { argentinaDate } from '@/lib/dates';
import { isCategory } from '@/lib/racing';
import { F1Guide } from '@/components/f1-guide';
import { DataFreshness } from '@/components/data-freshness';

type Props = {
  params: Promise<{ categoria: string; year: string }>;
  searchParams: Promise<{ vista?: string; temporada?: string; buscar?: string }>;
};

function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export default async function ArchivePage({ params, searchParams }: Props) {
  const { categoria, year: routeYear } = await params;
  if (!isCategory(categoria)) notFound();
  const query = await searchParams;
  const year = typeof query.temporada === 'string' ? query.temporada : routeYear;
  const view = query.vista === 'posiciones' || query.vista === 'campeones' || (categoria === 'f1' && query.vista === 'escuderias') ? query.vista : 'calendario';
  const [index, season] = await Promise.all([getArchive(categoria), getSeason(categoria, year)]);
  if (!season) notFound();
  const source = sources[categoria];
  const champions = index.champions.toSorted((a, b) => b[0] - a[0]);
  const hasChampionBrands = champions.some((row) => row[3]);
  const championTable = {
    name: 'Campeones por temporada',
    columns: hasChampionBrands ? ['Año', 'Campeonato', 'Campeón', 'Marca'] : ['Año', 'Campeonato', 'Campeón'],
    rows: hasChampionBrands ? champions : champions.map((row) => row.slice(0, 3)),
  };
  const search = typeof query.buscar === 'string' ? query.buscar.slice(0, 80) : '';
  const normalized = normalize(search);
  const events = season.events.filter((event) => normalize(`${event.name} ${event.venue ?? ''} ${event.winner ?? ''}`).includes(normalized));

  return (
    <>
      <CategoryNav active={categoria} />
      <SectionHero category={categoria} title={`Temporada ${year}`} subtitle={`${season.events.length} fechas · ${season.events.filter((event) => event.tables.length).length} con tablas de resultados`} />
      <DataFreshness category={categoria} year={year} />
      <div className="archive-toolbar">
        <ArchiveNav category={categoria} year={year} active={view} />
        <form action={`/categoria/${categoria}/archivo/${year}`} className="season-form">
          <input type="hidden" name="vista" value={view} />
          <label htmlFor="temporada">Temporada</label>
          <select id="temporada" name="temporada" defaultValue={year}>
            {index.seasons.map(({ year }) => <option key={year} value={year}>{year}</option>)}
          </select>
          <button type="submit">Ver</button>
        </form>
      </div>
      {view === 'calendario' ? (
        <section className="panel">
          <div className="section-heading"><h2>Fechas de la temporada</h2></div>
          <form className="archive-filter" action={`/categoria/${categoria}/archivo/${year}`}>
            <label htmlFor="buscar">Buscar fecha o circuito</label>
            <input type="search" id="buscar" name="buscar" defaultValue={search} maxLength={80} />
            <button type="submit">Buscar</button>
            {search ? <Link href={`/categoria/${categoria}/archivo/${year}`}>Limpiar</Link> : null}
          </form>
          {events.length ? (
            <ul className="archive-events">
              {events.map((event) => (
                <li key={event.id}>
                  <Link href={`/categoria/${categoria}/archivo/${year}/${event.id}`} prefetch={false}>
                    <span className="round-number numeric">{String(event.round).padStart(2, '0')}</span>
                    <span className="event-main"><strong>{event.name}</strong>{event.winner || event.venue ? <span>{event.winner ? `Ganó ${event.winner}` : event.venue}</span> : null}</span>
                    <span className="archive-status">{event.tables.length ? `${event.tables.length} tablas` : event.winner ? 'Ganador registrado' : event.date > argentinaDate() ? 'Programada' : 'Sin resultados'}</span>
                    <RaceDate date={event.date} />
                    <span aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="empty">{search ? 'No hay fechas que coincidan con la búsqueda.' : 'Todavía no hay fechas incorporadas para esta temporada.'}</p>}
        </section>
      ) : view === 'escuderias' && season.f1 ? <F1Guide entities={season.f1} year={year} /> : view === 'posiciones' ? (
        <div className="archive-stack">
          {season.tables.length ? season.tables.map((table) => <DataTable key={table.name} table={table} f1={season.f1} year={year} />) : <p className="empty panel">El campeonato de esta temporada todavía no está incorporado.</p>}
        </div>
      ) : champions.length || index.history?.length ? (
        <div className="archive-stack">
          {index.history?.map((table) => <DataTable key={table.name} table={table} />)}
          {champions.length ? <DataTable table={championTable} /> : null}
        </div>
      ) : <p className="empty panel">Todavía no hay campeones incorporados a este archivo.</p>}
      <p className="archive-credit">Datos de <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>. {index.generatedAt ? `Archivo actualizado el ${new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(index.generatedAt))}.` : 'Fecha de actualización pendiente de registrar.'}</p>
    </>
  );
}
