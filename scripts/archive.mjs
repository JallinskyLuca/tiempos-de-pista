import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { replaceFile } from './atomic-json.mjs';

export function validateSeason(year, season) {
  if (!/^\d{4}$/.test(String(year)) || !Array.isArray(season.events) || !Array.isArray(season.tables)) throw new Error('Temporada inválida.');
  const ids = new Set();
  for (const event of season.events) {
    if (typeof event.id !== 'string' || !event.id || ids.has(event.id)) throw new Error(`Fecha duplicada o sin identidad en ${year}.`);
    ids.add(event.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !event.date.startsWith(String(year)) || !Number.isFinite(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0, 10) !== event.date) throw new Error(`Fecha inválida ${event.date} en ${year}.`);
    if (!event.name || !Array.isArray(event.tables)) throw new Error('Evento incompleto.');
    for (const [name, instant] of event.schedule ?? []) {
      if (!name || !Number.isFinite(Date.parse(instant))) throw new Error('Horario inválido.');
    }
  }
  for (const table of [...season.tables, ...season.events.flatMap((event) => event.tables)]) {
    if (!table.name || !Array.isArray(table.columns) || table.columns.length < 2 || !Array.isArray(table.rows) || !table.rows.length) throw new Error('Tabla incompleta.');
    if (table.rows.some((row) => !Array.isArray(row) || row.length !== table.columns.length || row.some((cell) => typeof cell !== 'string' && (typeof cell !== 'number' || !Number.isFinite(cell))))) throw new Error(`Columnas inconsistentes en ${table.name}.`);
    if (table.rowEntities && table.rowEntities.length !== table.rows.length) throw new Error(`Identidades desalineadas en ${table.name}.`);
  }
}

async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

const semantic = (value) => JSON.stringify(value, (key, cell) => key === 'provenance' ? undefined : cell);

export async function writeArchive(category, seasons, champions = [], history = [], options = {}) {
  if (!['f1', 'tc', 'tn'].includes(category)) throw new Error('Categoría inválida.');
  for (const [year, season] of Object.entries(seasons)) validateSeason(year, season);
  if (!Object.keys(seasons).length) throw new Error('La importación no contiene temporadas.');
  const path = options.directory ?? new URL(`../data/archive/${category}/`, import.meta.url);
  await mkdir(new URL('revisions/', path), { recursive: true });
  const lock = new URL('.publish-lock', path);
  await writeFile(lock, String(process.pid), { flag: 'wx' });
  const temporaryIndex = new URL(`index-${randomUUID()}.tmp`, path);
  try {
    const previous = await readJson(new URL('index.json', path));
    const index = new Map((previous?.seasons ?? []).map((entry) => [entry.year, entry]));
    const generatedAt = new Date().toISOString();
    for (const [year, season] of Object.entries(seasons)) {
      const oldEntry = index.get(Number(year));
      if (oldEntry) {
        const previousSeason = await readJson(new URL(`${oldEntry.file ?? year}.json`, path));
        const newIds = new Set(season.events.map((event) => event.id));
        if (previousSeason?.events.some((event) => event.tables.length && !newIds.has(event.id))) throw new Error(`La importación perdería resultados publicados de ${year}.`);
        if (previousSeason?.tables.length && !season.tables.length) throw new Error(`El campeonato de ${year} quedó vacío.`);
        for (const oldEvent of previousSeason?.events ?? []) {
          const replacement = season.events.find((event) => event.id === oldEvent.id);
          if (oldEvent.tables.length && replacement && !replacement.tables.length) throw new Error(`Se perdieron las tablas de ${oldEvent.name}.`);
          const key = (table) => `${table.group ?? ''}:${table.name}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
          const sessions = new Set(replacement?.tables.map(key));
          if (oldEvent.tables.some((table) => !sessions.has(key(table)))) throw new Error(`Se perdieron sesiones de ${oldEvent.name}.`);
          if (options.strictResults && oldEvent.tables.some((table) => replacement.tables.find((next) => key(next) === key(table))?.rows.length < table.rows.length)) throw new Error(`Se redujo la clasificación de ${oldEvent.name}. Requiere revisión.`);
        }
        if (semantic(previousSeason) === semantic(season)) continue;
      }
      const body = JSON.stringify(season);
      const revision = createHash('sha256').update(body).digest('hex');
      const file = `revisions/${revision}`;
      await writeFile(new URL(file + '.json', path), body);
      index.set(Number(year), { year: Number(year), file, updatedAt: generatedAt, rounds: season.events.length, results: season.events.filter((event) => event.tables.length).length });
    }
    const seasonIndex = [...index.values()].sort((a, b) => b.year - a.year);
    const payload = {
      generatedAt, through: options.through, importer: options.importer ?? 'archive/2',
      seasons: seasonIndex,
      champions: options.merge ? [...new Map([...(previous?.champions ?? []), ...champions].map((row) => [JSON.stringify(row.slice(0, 2)), row])).values()] : champions,
      history: history.length || !options.merge ? history : previous?.history ?? [],
      source: options.source ?? previous?.source,
    };
    if (previous && semantic([payload.seasons, payload.champions, payload.history, payload.source]) === semantic([previous.seasons, previous.champions, previous.history ?? [], previous.source])) {
      console.log(category, 'sin cambios en los datos publicados');
      return { changed: false, revision: previous.revision };
    }
    payload.revision = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    if (previous) await writeFile(new URL(`revisions/index-${previous.revision ?? randomUUID()}.json`, path), JSON.stringify(previous));
    await writeFile(temporaryIndex, JSON.stringify(payload));
    await replaceFile(temporaryIndex, new URL('index.json', path));
    console.log(category, seasonIndex.length, 'temporadas,', seasonIndex.reduce((total, row) => total + row.results, 0), 'fechas con tablas');
    return { changed: true, revision: payload.revision };
  } finally {
    await unlink(temporaryIndex).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    await unlink(lock);
  }
}
