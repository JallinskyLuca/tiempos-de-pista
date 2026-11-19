import Link from 'next/link';
import { categories, type Category } from '@/lib/racing';
import { CompetitionLogo } from './racing-ui';
export { DataTable } from './data-table';

export function SectionHero({ category, title, subtitle }: { category: Category; title: string; subtitle: string }) {
  return (
    <header className="section-hero" data-category={category}>
      <div>
        <p>{categories[category].name}</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
      <CompetitionLogo category={category} />
    </header>
  );
}

export function ArchiveNav({ category, year, active }: { category: Category; year: string; active: string }) {
  const base = `/categoria/${category}/archivo/${year}`;
  return (
    <nav className="archive-tabs" aria-label="Contenido de la categoría">
      <Link href={base} aria-current={active === 'calendario' ? 'page' : undefined}>Calendario y resultados</Link>
      <Link href={`${base}?vista=posiciones`} aria-current={active === 'posiciones' ? 'page' : undefined}>Posiciones</Link>
      {category === 'f1' ? <Link href={`${base}?vista=escuderias`} aria-current={active === 'escuderias' ? 'page' : undefined}>Pilotos y escuderías</Link> : null}
      <Link href={`${base}?vista=campeones`} aria-current={active === 'campeones' ? 'page' : undefined}>Campeones</Link>
    </nav>
  );
}
