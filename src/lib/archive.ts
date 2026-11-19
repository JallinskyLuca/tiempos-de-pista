import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cache } from 'react';
import type { Category } from './racing';

export type ArchiveTable = {
  id?: string;
  name: string;
  group?: string;
  sourceUrl?: string;
  columns: string[];
  rows: (string | number)[][];
  rowEntities?: { driverId?: string; constructorId?: string }[];
};

export type F1Driver = { id: string; name: string; abbreviation: string; number: number | null; nationality: string; countryCode: string; dateOfBirth: string; teams: string[]; points: number; position: number | null; photo: string | null };
export type F1Team = { id: string; name: string; fullName: string; country: string; points: number; position: number | null; engines: string[]; chassis: string[]; drivers: string[]; color: string };
export type F1Entities = { drivers: F1Driver[]; teams: F1Team[] };

export type ArchiveEvent = {
  id: string;
  date: string;
  round: number;
  name: string;
  venue?: string;
  source: string;
  winner?: string;
  winnerCar?: string;
  schedule?: [string, string][];
  tables: ArchiveTable[];
  revision?: string;
};

export type Season = { events: ArchiveEvent[]; tables: ArchiveTable[]; revision?: string; f1?: F1Entities };
type Archive = {
  generatedAt?: string;
  through?: string;
  revision?: string;
  source?: { name: string; version: string; url: string };
  seasons: { year: number; rounds: number; results: number; file?: string; updatedAt?: string }[];
  champions: [number, string, string, string][];
  history?: ArchiveTable[];
};

async function read<T>(category: Category, file: string): Promise<T> {
  const content = await readFile(join(process.cwd(), 'data', 'archive', category, file + '.json'), 'utf8');
  return JSON.parse(content) as T;
}

export const getArchive = cache((category: Category) => read<Archive>(category, 'index'));
export const getSeason = cache(async (category: Category, year: string) => {
  if (!/^\d{4}$/.test(year)) return null;
  const index = await getArchive(category);
  const entry = index.seasons.find((season) => String(season.year) === year);
  if (!entry) return null;
  const file = entry.file && /^revisions\/[a-f0-9]{64}$/.test(entry.file) ? entry.file : year;
  return read<Season>(category, file);
});

export function eventHref(category: Category, year: string | number, eventId: string) {
  return `/categoria/${category}/archivo/${year}/${eventId}`;
}

export const sources = {
  f1: { name: 'F1DB (CC BY 4.0)', url: 'https://github.com/f1db/f1db/releases/tag/v2026.20.0' },
  tc: { name: 'ACTC', url: 'https://tiempos.actc.org.ar/resultados' },
  tn: { name: 'APAT', url: 'https://apat.org.ar/resultados/historico' },
};
