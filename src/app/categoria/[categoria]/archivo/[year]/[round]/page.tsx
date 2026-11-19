import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DataTable, SectionHero } from '@/components/archive-ui';
import { CategoryNav, RaceDate } from '@/components/racing-ui';
import { getSeason, sources } from '@/lib/archive';
import { formatDate, formatTime, isCategory } from '@/lib/racing';
import { EventActions } from '@/components/event-actions';
import { DriverOfTheDay } from '@/components/f1-guide';
import { DataFreshness } from '@/components/data-freshness';
import { SessionPicker } from '@/components/session-picker';

type Props = {
  params: Promise<{ categoria: string; year: string; round: string }>;
  searchParams: Promise<{ sesion?: string; clase?: string }>;
};

export default async function ArchiveRacePage({ params, searchParams }: Props) {
  const { categoria, year, round } = await params;
  if (!isCategory(categoria)) notFound();
  const season = await getSeason(categoria, year);
  const event = season?.events.find(({ id }) => id === round);
  if (!event) notFound();
  const { sesion, clase } = await searchParams;
  const groups = [...new Set(event.tables.flatMap(({ group }) => group ? [group] : []))];
  const group = groups.find((group) => group === clase) ?? groups[0];
  const sessions = event.tables.map((table, index) => ({ table, index })).filter(({ table }) => !group || table.group === group);
  const index = typeof sesion === 'string' && /^\d+$/.test(sesion) ? Number(sesion) : 0;
  const active = sessions.find((session) => session.index === index) ?? sessions[0];
  const table = active?.table;
  const source = sources[categoria];
  const driverColumn = table?.columns.indexOf('Piloto') ?? -1;
  const podium = table && driverColumn >= 0 && /^(carrera|final)\b/i.test(table.name) && !/parciales/i.test(table.name)
    ? table.rows.filter(([position]) => /^[123]°?$/.test(String(position))).slice(0, 3)
    : [];

  return (
    <>
      <CategoryNav active={categoria} />
      <Link className="back-link" href={`/categoria/${categoria}/archivo/${year}`}>‹ Temporada {year}</Link>
      <SectionHero category={categoria} title={event.name} subtitle={`Fecha ${event.round} · ${formatDate(event.date)} ${year}${event.venue ? ` · ${event.venue}` : ''}`} />
      <DataFreshness category={categoria} year={year} />
      <EventActions hasResults={event.tables.length > 0} event={{ key: `${categoria}:${year}:${event.id}`, category: categoria, year, id: event.id, name: event.name, date: event.date }} />
      <nav className="adjacent-events" aria-label="Otras fechas">
        {season?.events[season.events.indexOf(event) - 1] ? <Link href={`/categoria/${categoria}/archivo/${year}/${season.events[season.events.indexOf(event) - 1].id}`}>Fecha anterior</Link> : <span />}
        {season?.events[season.events.indexOf(event) + 1] ? <Link href={`/categoria/${categoria}/archivo/${year}/${season.events[season.events.indexOf(event) + 1].id}`}>Fecha siguiente</Link> : null}
      </nav>
      {categoria === 'f1' && season?.f1 ? <DriverOfTheDay event={event} entities={season.f1} year={year} /> : null}
      {table ? (
        <>
          {podium.length ? (
            <ol className="podium" aria-label="Podio">
              {podium.map((row, index) => (
                <li key={index}><span className="numeric">{String(row[0]).replace(/°$/, '')}°</span><strong>{row[driverColumn]}</strong></li>
              ))}
            </ol>
          ) : null}
          {groups.length > 1 ? (
            <nav className="archive-tabs group-selector" aria-label="Clases del TN">
              {groups.map((name) => <Link key={name} href={`?clase=${encodeURIComponent(name)}`} aria-current={name === group ? 'page' : undefined}>{name}</Link>)}
            </nav>
          ) : null}
          <SessionPicker sessions={sessions.map(({ table, index }) => ({ index, name: table.name }))} active={active?.index ?? 0} group={group} />
          <DataTable key={`${group}-${active?.index}`} id="resultado" table={table} f1={season?.f1} year={year} />
        </>
      ) : event.winner ? (
        <section className="panel">
          <div className="section-heading"><h2>Ganador registrado</h2></div>
          <p className="empty"><strong>{event.winner}</strong>{event.winnerCar ? ` · ${event.winnerCar}` : ''}</p>
        </section>
      ) : event.schedule?.length ? null : <p className="empty panel">Esta fecha todavía no tiene tablas de resultados en el archivo.</p>}
      {event.schedule?.length ? (
        <section className="panel event-schedule">
          <div className="section-heading"><h2>Cronograma</h2><span className="section-meta">Hora argentina</span></div>
          <ul className="event-list">
            {event.schedule.map(([session, time]) => <li key={session}><strong>{session}</strong><RaceDate date={time} /><time className="numeric" dateTime={time}>{formatTime(time)}</time></li>)}
          </ul>
        </section>
      ) : null}
      <p className="archive-credit">Datos de <a href={table?.sourceUrl ?? (event.winner && categoria === 'tc' ? 'https://actc.org.ar/institucional/ganadores' : source.url)} target="_blank" rel="noreferrer">{source.name}</a>{categoria === 'f1' ? ' · Datos adaptados al formato de Tiempos de Pista.' : '.'}</p>
    </>
  );
}
