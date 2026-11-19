import Link from 'next/link';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { getArchive, getSeason } from '@/lib/archive';
import { DriverAvatar } from '@/components/driver-avatar';
import { CategoryNav } from '@/components/racing-ui';

export default async function TeamPage({ params }: { params: Promise<{ year: string; id: string }> }) {
  const { year, id } = await params;
  const [season, archive] = await Promise.all([getSeason('f1', year), getArchive('f1')]);
  const team = season?.f1?.teams.find((team) => team.id === id);
  if (!team || !season?.f1) notFound();
  const drivers = season.f1.drivers.filter((driver) => team.drivers.includes(driver.id));
  return <>
    <CategoryNav active="f1" />
    <Link className="back-link" href={`/categoria/f1/archivo/${year}?vista=escuderias`}>‹ Pilotos y escuderías de {year}</Link>
    <header className="person-hero team-hero" style={{ '--team-color': team.color } as CSSProperties}><div><p>Fórmula 1 · Temporada {year}</p><h1>{team.name}</h1><p>{team.fullName} · {team.country}</p></div></header>
    <dl className="profile-facts"><div><dt>Posición</dt><dd>{team.position ? `${team.position}°` : 'Sin registro'}</dd></div><div><dt>Puntos</dt><dd>{team.points}</dd></div><div><dt>Motor</dt><dd>{team.engines.join(' / ') || 'Sin registro'}</dd></div><div><dt>Chasis</dt><dd>{team.chassis.join(' / ') || 'Sin registro'}</dd></div></dl>
    <section className="panel"><div className="section-heading"><h2>Pilotos de {year}</h2></div><ul className="team-drivers">{drivers.map((driver) => <li key={driver.id}><Link href={`/f1/${year}/piloto/${driver.id}`}><DriverAvatar name={driver.name} photo={driver.photo} /><span><strong>{driver.name}</strong><small>{driver.nationality}</small></span><span className="driver-number numeric">{driver.number ?? '—'}</span></Link></li>)}</ul></section>
    <p className="archive-credit">La ficha conserva todos los pilotos y motorizaciones registrados para la escudería durante la temporada. <a href={archive.source?.url ?? 'https://github.com/f1db/f1db'}>Fuente: F1DB (CC BY 4.0)</a>.</p>
  </>;
}
