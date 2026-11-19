import { getArchive, getSeason, type ArchiveEvent } from './archive';
import { argentinaDate, argentinaWeek } from './dates';
import { categories, type Category } from './racing';

export type ListedEvent = ArchiveEvent & { category: Category; year: number };

export async function getDashboard(now = new Date(), selectedDate?: string) {
  const week = argentinaWeek(now, selectedDate);
  const years = [...new Set([Number(week.start.slice(0, 4)), Number(week.end.slice(0, 4)), now.getUTCFullYear() - 1])];
  const snapshots = await Promise.all((Object.keys(categories) as Category[]).map(async (category) => {
    const index = await getArchive(category);
    const latest = index.seasons[0];
    const requested = [...new Set([...years, latest.year])];
    const seasons = await Promise.all(requested.map(async (year) => {
      const data = await getSeason(category, String(year));
      return { year, data };
    }));
    return { category, index, seasons };
  }));
  const events: ListedEvent[] = snapshots.flatMap(({ category, seasons }) => seasons.flatMap(({ year, data }) =>
    data?.events.map((event) => ({ ...event, category, year })) ?? [],
  )).sort((a, b) => a.date.localeCompare(b.date) || a.category.localeCompare(b.category));
  const sessions = events.flatMap((event) => (event.schedule ?? []).map(([name, startsAt]) => ({
    event, name, startsAt, day: argentinaDate(new Date(startsAt)),
  }))).filter(({ day }) => day >= week.start && day <= week.end)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const weekend = events.filter((event) => event.date >= week.start && event.date <= week.end);
  const previous = events.filter((event) => event.tables.length > 0 && event.date <= week.today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = events.filter((event) => event.date > week.end);
  const championships = snapshots.flatMap(({ category, index, seasons }) => {
    const year = index.seasons.find((entry) => entry.year <= Number(week.today.slice(0, 4)))?.year;
    const season = seasons.find((season) => season.year === year)?.data;
    return season?.tables.map((table) => ({ ...table, category, year: year! })) ?? [];
  });
  return { week, sessions, weekend, previous, upcoming, championships, snapshots };
}
