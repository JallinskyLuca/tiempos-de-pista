import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArchive, getSeason } from '@/lib/archive';
import { DriverAvatar } from '@/components/driver-avatar';
import { DataTable } from '@/components/data-table';
import { CategoryNav } from '@/components/racing-ui';

export default async function DriverPage({ params }: { params: Promise<{ year: string; id: string }> }) {
  const { year, id } = await params;
  const [season, archive] = await Promise.all([getSeason('f1', year), getArchive('f1')]);
  const driver = season?.f1?.drivers.find((driver) => driver.id === id);
  if (!driver || !season?.f1) notFound();
  const results = season.events.flatMap((event) => {
    const race = event.tables.find((table) => table.name === 'Carrera');
    return race?.rows.flatMap((row, index) => race.rowEntities?.[index]?.driverId === id ? [[event.name, row[0], row[race.columns.indexOf('Equipo')] ?? '', row[race.columns.indexOf('Puntos')] ?? '']] : []) ?? [];
  });
  return <>
    <CategoryNav active="f1" />
    <Link className="back-link" href={`/categoria/f1/archivo/${year}?vista=escuderias`}>‹ Pilotos y escuderías de {year}</Link>
    <header className="person-hero"><DriverAvatar name={driver.name} photo={driver.photo} large /><div><p>Fórmula 1 · Temporada {year}</p><h1>{driver.name}</h1><p>{driver.nationality}{driver.number !== null ? ` · Auto ${driver.number}` : ''}</p></div></header>
    <dl className="profile-facts"><div><dt>Posición</dt><dd>{driver.position ? `${driver.position}°` : 'Sin registro'}</dd></div><div><dt>Puntos</dt><dd>{driver.points}</dd></div><div><dt>Escuderías</dt><dd>{driver.teams.map((team, index) => <span key={team}>{index ? ', ' : ''}<Link href={`/f1/${year}/escuderia/${team}`}>{season.f1!.teams.find((entry) => entry.id === team)?.name ?? team}</Link></span>)}</dd></div></dl>
    <DataTable table={{ name: `Resultados de carrera de ${year}`, columns: ['Gran Premio', 'Pos.', 'Equipo', 'Puntos'], rows: results }} />
    <p className="archive-credit">Resultados dentro de la cobertura publicada. <a href={archive.source?.url ?? 'https://github.com/f1db/f1db'}>Fuente: F1DB (CC BY 4.0)</a>.</p>
  </>;
}
