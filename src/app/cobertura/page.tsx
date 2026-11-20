import Link from 'next/link';
import { connection } from 'next/server';
import { getArchive, sources } from '@/lib/archive';
import { categories, type Category } from '@/lib/racing';
import { CompetitionLogo } from '@/components/racing-ui';
import { DataFreshness } from '@/components/data-freshness';

const scope = {
  f1: 'F1DB aporta las sesiones y estadísticas de su archivo histórico bajo CC BY 4.0. OpenF1 agrega las sesiones terminadas que importamos durante el fin de semana, con clasificación, vueltas y telemetría. La telemetría de OpenF1 existe desde 2023; su disponibilidad aquí corresponde a las sesiones importadas, no a todas las temporadas del archivo.',
  tc: 'Clasificaciones de sesión de 2026, campeonatos desde 2010 y ganadores históricos desde 1937. Hay fechas que conservan el ganador sin clasificación completa. Las tablas detalladas anteriores a 2026 están pendientes.',
  tn: 'Tablas de clases 2 y 3 disponibles en el archivo HTML de APAT desde 2003. Las posiciones históricas y el registro de campeones tienen cobertura parcial.',
};

export default async function CoveragePage() {
  await connection();
  const archives = await Promise.all((Object.keys(categories) as Category[]).map(async (category) => ({ category, index: await getArchive(category) })));
  return <>
    <header className="edition-heading"><h1>Fuentes y cobertura</h1><p>Qué podés consultar en el archivo y hasta dónde llegan los datos disponibles.</p></header>
    <div className="archive-stack">
      {archives.map(({ category, index }) => {
        const oldest = index.seasons.at(-1)?.year;
        const latest = index.seasons[0]?.year;
        const results = index.seasons.reduce((count, season) => count + season.results, 0);
        const events = index.seasons.reduce((count, season) => count + season.rounds, 0);
        return <section className="panel" key={category}>
          <div className="section-heading"><h2><CompetitionLogo category={category} /> {categories[category].name}</h2></div>
          <p className="empty"><strong>{oldest}–{latest} · {index.seasons.length} temporadas</strong><br />{results.toLocaleString('es-AR')} de {events.toLocaleString('es-AR')} fechas tienen al menos una tabla. Este indicador no implica que todas las sesiones estén completas.</p>
          <p className="empty">{scope[category]}</p>
          <DataFreshness category={category} />
          <p className="empty">{index.generatedAt ? `Última publicación del archivo: ${new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(index.generatedAt))}.` : 'La primera importación no registró una fecha de actualización.'} Las actualizaciones se publican por importación; la web no ofrece cronometraje en vivo.</p>
          <Link className="source" href={`/categoria/${category}/archivo/${latest}`}>Explorar resultados</Link><a className="source" href={sources[category].url} rel="noreferrer" target="_blank">Fuente: {sources[category].name}</a>
        </section>;
      })}
    </div>
    <section className="panel event-schedule"><div className="section-heading"><h2>Cómo se actualizan los resultados</h2></div><p className="empty">El actualizador consulta las fuentes durante las ventanas de actividad del calendario. Si falta una final, reintenta durante los dos días siguientes. Una respuesta incompleta o bloqueada conserva los resultados anteriores. La última consulta y la última publicación se registran por separado.</p><p className="empty">F1DB publica versiones después de las carreras. OpenF1 se consulta desde 30 minutos después del final de cada sesión, con la demora adicional del actualizador y del proveedor. La web ofrece análisis de sesiones finalizadas y no cronometraje en vivo. Cada tabla identifica su fuente; una sesión sin tiempos requiere confirmación oficial.</p><p className="empty">Los retratos y los logos de escuderías 2026 provienen de la CDN oficial de Fórmula 1 y se sirven localmente. Cuando falta un retrato identificado se muestran iniciales. Las marcas pertenecen a sus respectivos titulares; este es un proyecto independiente.</p></section>
  </>;
}
