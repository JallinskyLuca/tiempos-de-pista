import Link from 'next/link';
import Image from 'next/image';
import { archiveRaceHref, categories, formatDate, formatPoints, type Category, type Championship, type Race } from '@/lib/racing';

export function CategoryNav({ active }: { active?: Category }) {
  return (
    <nav className="category-nav" aria-label="Categorías">
      <Link href="/" aria-current={active === undefined ? 'page' : undefined}><span className="flag" aria-hidden="true" /> <span>Inicio</span></Link>
      {(Object.keys(categories) as Category[]).map((id) => (
        <Link key={id} href={`/categoria/${id}`} data-category={id}
          aria-current={active === id ? 'page' : undefined}>
          <CompetitionLogo category={id} /><span className="wide-category-name">{categories[id].name}</span><span className="compact-category-name">{categories[id].short}</span>
        </Link>
      ))}
    </nav>
  );
}

const logos = { f1: 'f1.svg', tc: 'tc.png', tn: 'tn.jpg' };

export function CompetitionLogo({ category }: { category: Category }) {
  return <Image className="competition-logo" src={`/competencias/${logos[category]}`} alt="" width={46} height={32} unoptimized />;
}

export function CategoryTag({ category }: { category: Category }) {
  return <span className="category-tag" data-category={category}>{categories[category].short}</span>;
}

export function RaceLink({ race }: { race: Race }) {
  return <Link href={archiveRaceHref(race)}>{race.name}</Link>;
}

export function RaceDate({ date }: { date: string }) {
  return <time dateTime={date}>{formatDate(date)}</time>;
}

export function Standings({ tables }: { tables: Championship[] }) {
  return tables.map(({ category, name, rows }) => (
    <table key={name} className="standings" data-category={category}>
      <caption><Link href={`/categoria/${category}/archivo/2026?vista=posiciones`}>{name} <span aria-hidden="true">›</span></Link></caption>
      <thead><tr><th scope="col">Pos.</th><th scope="col">Piloto</th><th scope="col">Pts.</th></tr></thead>
      <tbody>
        {rows.map(([driver, points], index) => (
          <tr key={driver}>
            <td className="muted numeric">{index + 1}</td>
            <th scope="row">{driver}</th>
            <td className="numeric">{formatPoints(points)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ));
}
