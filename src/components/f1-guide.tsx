import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ArchiveEvent, F1Entities } from '@/lib/archive';
import { DriverAvatar } from './driver-avatar';
import { TeamLogo } from './team-logo';

export function F1Guide({ entities, year }: { entities: F1Entities; year: string }) {
  return <section aria-labelledby="f1-grid">
    <div className="content-heading"><div><h2 id="f1-grid">La grilla de {year}</h2><p>{entities.teams.length} escuderías. Pilotos y marcas registrados en esta temporada.</p></div><a className="button button-secondary" href="#lista-pilotos">Ver todos los pilotos</a></div>
    <div className="teams-grid">
      {entities.teams.map((team) => <article className="team-card" key={team.id} style={{ '--team-color': team.color } as CSSProperties}>
        <header><TeamLogo id={team.id} year={year}/><div><span className="team-position">{team.position ? `${team.position}° en el campeonato` : 'Sin posición registrada'}</span><h3><Link href={`/f1/${year}/escuderia/${team.id}`}>{team.name}</Link></h3></div><strong className="team-points numeric">{team.points}<small>puntos</small></strong></header>
        <dl className="team-facts"><div><dt>Motor</dt><dd>{team.engines.join(' / ') || 'Sin registro'}</dd></div><div><dt>Chasis</dt><dd>{team.chassis.join(' / ') || 'Sin registro'}</dd></div></dl>
        <ul className="team-drivers">{team.drivers.map((id) => {
          const driver = entities.drivers.find((driver) => driver.id === id);
          return driver ? <li key={id}><Link href={`/f1/${year}/piloto/${id}`}><DriverAvatar name={driver.name} photo={driver.photo} /><span><strong>{driver.name}</strong><small>{driver.points} puntos en la temporada</small></span><span className="driver-number numeric">{driver.number ?? '—'}</span></Link></li> : null;
        })}</ul>
        <Link className="team-detail-link" href={`/f1/${year}/escuderia/${team.id}`}>Ver escudería</Link>
      </article>)}
    </div>
    <div className="content-heading" id="lista-pilotos"><div><h2>Pilotos de la temporada</h2><p>Los cambios de escudería durante el año se conservan en sus fichas.</p></div></div>
    <ul className="drivers-grid">{entities.drivers.map((driver) => <li key={driver.id}><Link href={`/f1/${year}/piloto/${driver.id}`}><DriverAvatar name={driver.name} photo={driver.photo} /><span><strong>{driver.name}</strong><small>{driver.nationality} · {driver.points} puntos</small></span></Link></li>)}</ul>
  </section>;
}

export function DriverOfTheDay({ event, entities, year }: { event: ArchiveEvent; entities: F1Entities; year: string }) {
  const table = event.tables.find((table) => table.name === 'Piloto del día');
  const id = table?.rowEntities?.[0]?.driverId;
  const driver = entities.drivers.find((driver) => driver.id === id);
  if (!driver || !table) return null;
  const votesColumn = table.columns.indexOf('Votos');
  const votes = votesColumn >= 0 ? table.rows[0]?.[votesColumn] : null;
  return <section className="driver-of-day" aria-labelledby="driver-day-title">
    <DriverAvatar name={driver.name} photo={driver.photo} large />
    <div><h2 id="driver-day-title">Piloto del día</h2><Link href={`/f1/${year}/piloto/${driver.id}`}>{driver.name}</Link><p>{votes !== null && votes !== '' ? `${votes}% de los votos registrados` : 'Distinción registrada en la fuente'} · {event.name}</p></div>
    <a className="button button-secondary" href={`?sesion=${event.tables.indexOf(table)}#resultado`}>Ver votación</a>
  </section>;
}
