import Link from 'next/link';
import { eventHref } from '@/lib/archive';
import { getDashboard, type ListedEvent } from '@/lib/dashboard';
import { categories, formatDate, formatTime, type Category } from '@/lib/racing';
import { CategoryNav, CategoryTag, CompetitionLogo, RaceDate } from './racing-ui';
import { DataTable } from './archive-ui';
import { DataFreshness } from './data-freshness';

function EventList({ events }: { events: ListedEvent[] }) {
  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={`${event.category}-${event.year}-${event.id}`}>
          <CategoryTag category={event.category} />
          <div className="event-main">
            <Link href={eventHref(event.category, event.year, event.id)}>{event.name}</Link>
            <span>{event.winner ? `Ganó ${event.winner}` : event.venue ?? categories[event.category].name}</span>
          </div>
          <RaceDate date={event.date} />
        </li>
      ))}
    </ul>
  );
}

export async function Overview({ selectedDate, filter }: { selectedDate?: string; filter?: Category }) {
  const dashboard = await getDashboard(new Date(), selectedDate);
  const { week, snapshots } = dashboard;
  const sessions = dashboard.sessions.filter(({ event }) => !filter || event.category === filter);
  const weekend = dashboard.weekend.filter((event) => !filter || event.category === filter);
  const previous = dashboard.previous.filter((event) => !filter || event.category === filter).slice(0, 6);
  const upcoming = dashboard.upcoming.filter((event) => !filter || event.category === filter).slice(0, 6);
  const tables = dashboard.championships.filter((table) => !filter || table.category === filter);
  const suffix = filter ? `&categoria=${filter}` : '';

  return (
    <>
      <CategoryNav />
      <header className="front-hero">
        <div>
          <h1>Este <span>finde</span></h1>
          <p>{formatDate(week.start)} al {formatDate(week.end)} de {week.end.slice(0, 4)} <span>·</span> Hora argentina</p>
        </div>
        <div className="front-hero-mark" aria-hidden="true"><span className="flag" /></div>
      </header>
      <div className="competition-strip" aria-label="Archivos de las competencias">
        {snapshots.map(({ category, index }) => (
          <Link key={category} href={`/categoria/${category}/archivo/${index.seasons[0].year}`} data-category={category}>
            <CompetitionLogo category={category} />
            <span><strong>{categories[category].name}</strong><small>Calendario y archivo</small></span>
          </Link>
        ))}
      </div>
      {filter ? <DataFreshness category={filter} /> : null}
      <div className="week-controls">
        <nav className="archive-tabs" aria-label="Filtrar agenda">
          <Link href={`?semana=${week.start}`} aria-current={!filter ? 'page' : undefined}>Todas</Link>
          {(Object.keys(categories) as Category[]).map((category) => (
            <Link key={category} href={`?semana=${week.start}&categoria=${category}`} aria-current={category === filter ? 'page' : undefined}>{categories[category].short}</Link>
          ))}
        </nav>
        <nav className="week-navigation" aria-label="Cambiar semana">
          <Link href={`?semana=${week.previous}${suffix}`}>Anterior</Link>
          <Link href="/">Esta semana</Link>
          <Link href={`?semana=${week.next}${suffix}`}>Siguiente</Link>
        </nav>
      </div>
      <div className="overview">
        <div className="overview-column">
          <section className="panel" aria-labelledby="agenda">
            <div className="section-heading"><h2 id="agenda">Agenda de la semana</h2><span className="section-meta">Hora argentina</span></div>
            {sessions.length ? (
              <table className="agenda">
                <thead><tr><th scope="col">Día</th><th scope="col">Hora</th><th scope="col">Sesión</th></tr></thead>
                <tbody>
                  {sessions.map(({ event, name, startsAt, day }) => (
                    <tr key={`${event.category}-${event.id}-${name}`} className={day === week.today ? 'today-row' : undefined}>
                      <td><time dateTime={startsAt}>{formatDate(startsAt, true)}</time>{day === week.today ? <small className="today-label">Hoy</small> : null}</td>
                      <td className="numeric"><time dateTime={startsAt}>{formatTime(startsAt)}</time></td>
                      <th scope="row">
                        <span className="session-label"><CategoryTag category={event.category} />{name}</span>
                        <span className="session-event"><Link href={eventHref(event.category, event.year, event.id)}>{event.name}</Link></span>
                      </th>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">Todavía no hay horarios publicados en el archivo para esta semana.</p>}
            {weekend.filter((event) => !event.schedule?.length).length ? (
              <div className="unscheduled">
                <p className="empty">Fechas con horarios pendientes</p>
                <EventList events={weekend.filter((event) => !event.schedule?.length)} />
              </div>
            ) : null}
          </section>
          <section className="panel">
            <div className="section-heading"><h2>Últimos resultados</h2><Link className="inline-link" href="/archivo">Explorar archivo</Link></div>
            {previous.length ? <EventList events={previous} /> : <p className="empty">No hay resultados para esta selección.</p>}
          </section>
          <section className="panel">
            <div className="section-heading"><h2>Próximas fechas</h2></div>
            {upcoming.length ? <EventList events={upcoming} /> : <p className="empty">Próximas fechas pendientes de publicación.</p>}
          </section>
        </div>
        <aside className="overview-column" aria-label="Campeonatos">
          {tables.map((table) => {
            const points = table.columns.findIndex((name) => /^(puntos|pts\.?)$/i.test(name));
            const driver = table.columns.findIndex((name) => /^(piloto|equipo)$/i.test(name));
            const indexes = [0, driver, points].filter((value, index, all) => value >= 0 && all.indexOf(value) === index);
            return (
              <section className="panel" key={`${table.category}-${table.name}`}>
                <div className="mini-championship" data-category={table.category}><CompetitionLogo category={table.category} /><Link href={`/categoria/${table.category}/archivo/${table.year}?vista=posiciones`}>{categories[table.category].short} · {table.name}</Link></div>
                <DataTable embedded table={{ name: table.name, columns: indexes.map((index) => table.columns[index]), rows: table.rows.slice(0, 5).map((row) => indexes.map((index) => row[index])) }} />
                <Link className="source" href={`/categoria/${table.category}/archivo/${table.year}?vista=posiciones`}>Ver campeonato completo</Link>
              </section>
            );
          })}
        </aside>
      </div>
    </>
  );
}
