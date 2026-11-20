import Link from 'next/link';
import { eventHref } from '@/lib/archive';
import { getDashboard, type ListedEvent } from '@/lib/dashboard';
import { categories, formatDate, formatTime, type Category } from '@/lib/racing';
import { CategoryNav, CategoryTag, CompetitionLogo, RaceDate } from './racing-ui';
import { DataTable } from './archive-ui';
import { DataFreshness } from './data-freshness';
import { NewsSection, VideoSection } from './paddock-content';

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

export async function Overview({ selectedDate, filter, kind = 'calendar' }: { selectedDate?: string; filter?: Category; kind?: 'home' | 'calendar' | 'category' }) {
  const dashboard = await getDashboard(new Date(), selectedDate);
  const { week, snapshots } = dashboard;
  const sessions = dashboard.sessions.filter(({ event }) => !filter || event.category === filter);
  const weekend = dashboard.weekend.filter((event) => !filter || event.category === filter);
  const previous = dashboard.previous.filter((event) => !filter || event.category === filter).slice(0, 6);
  const upcoming = dashboard.upcoming.filter((event) => !filter || event.category === filter).slice(0, 6);
  const tables = dashboard.championships.filter((table) => !filter || table.category === filter);
  const suffix = filter ? `&categoria=${filter}` : '';
  const currentYear = snapshots.find((snapshot) => snapshot.category === filter)?.index.seasons[0]?.year;
  const base = filter && currentYear ? `/categoria/${filter}/archivo/${currentYear}` : '/archivo';
  const headline = kind === 'home' ? 'Actualidad de pista' : kind === 'category' && filter ? categories[filter].name : 'Este finde';
  const featured = filter ? weekend[0] ?? dashboard.upcoming.find((event) => event.category === filter) ?? previous[0] : undefined;

  return (
    <>
      <CategoryNav active={filter} />
      <header className="front-hero" data-category={filter}>
        <div>
          <h1>{headline}</h1>
          <p>{formatDate(week.start)} al {formatDate(week.end)} de {week.end.slice(0, 4)} <span>·</span> Hora argentina</p>
        </div>
        <div className="front-hero-mark" aria-hidden="true"><span className="flag" /></div>
      </header>
      {kind !== 'category' ? <div className="competition-strip" aria-label="Centros de las competencias">
        {snapshots.map(({ category, index }) => (
          <Link key={category} href={`/categoria/${category}`} data-category={category}>
            <CompetitionLogo category={category} />
            <span><strong>{categories[category].name}</strong><small>Noticias, videos y resultados · {index.seasons[0].year}</small></span>
          </Link>
        ))}
      </div> : <nav className="hub-actions" aria-label="Explorar la competencia"><Link className="button button-primary" href={base}>Calendario y resultados</Link><Link className="button" href={`${base}?vista=posiciones`}>Posiciones</Link>{filter === 'f1' ? <Link className="button" href={`${base}?vista=escuderias`}>Pilotos y escuderías</Link> : null}<Link className="button" href={`${base}?vista=campeones`}>Historia y campeones</Link></nav>}
      {filter ? <DataFreshness category={filter} /> : null}
      {kind === 'category' && featured ? <section className="featured-event panel" data-category={filter} aria-labelledby="fecha-destacada"><div><p>{weekend.some((event) => event.id === featured.id) ? 'Este fin de semana' : featured.date > week.today ? 'Próxima fecha' : 'Última fecha con resultados'}</p><h2 id="fecha-destacada">{featured.name}</h2><span>Fecha {featured.round} · {formatDate(featured.date)} {featured.year}</span></div><Link className="button button-primary" href={eventHref(featured.category, featured.year, featured.id)}>Horarios y sesiones</Link></section> : null}
      {kind !== 'calendar' ? <div className="paddock-content"><NewsSection category={filter} /><VideoSection category={filter} /></div> : null}
      <div className="week-controls">
        {kind !== 'category' ? <nav className="archive-tabs" aria-label="Filtrar agenda">
          <Link href={`?semana=${week.start}`} aria-current={!filter ? 'page' : undefined}>Todas</Link>
          {(Object.keys(categories) as Category[]).map((category) => (
            <Link key={category} href={`?semana=${week.start}&categoria=${category}`} aria-current={category === filter ? 'page' : undefined}>{categories[category].short}</Link>
          ))}
        </nav> : null}
        <nav className="week-navigation" aria-label="Cambiar semana">
          <Link href={`?semana=${week.previous}${suffix}`}>Anterior</Link>
          <Link href={kind === 'category' && filter ? `/categoria/${filter}` : kind === 'home' ? '/' : '/calendario'}>Esta semana</Link>
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
            <div className="section-heading"><h2>Últimos resultados</h2><Link className="inline-link" href={base}>Explorar archivo</Link></div>
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
