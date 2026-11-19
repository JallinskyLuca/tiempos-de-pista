import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeArchive } from './archive.mjs';
import { buildF1Entities } from './f1-entities.mjs';

const input = process.argv[2];
if (!input) throw new Error('Indicá el directorio package/data del archivo JSON dividido de F1DB.');
const currentYear = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric' }).format(new Date()));
const packageInfo = JSON.parse(await readFile(join(input, '..', 'package.json'), 'utf8'));
if (!/^\d{4}\.\d+\.\d+$/.test(packageInfo.version)) throw new Error('Versión de F1DB inválida.');
const sourceUrl = `https://github.com/f1db/f1db/releases/tag/v${packageInfo.version}`;
let media = null;
try { media = JSON.parse(await readFile(new URL('../data/f1-media.json', import.meta.url), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

async function read(name) {
  return JSON.parse(await readFile(join(input, `f1db-${name}.json`), 'utf8'));
}

const source = 'F1DB · CC BY 4.0';
const [races, drivers, constructors, circuits, grandsPrix, driverStandings, constructorStandings] = await Promise.all(
  ['races', 'drivers', 'constructors', 'circuits', 'grands-prix', 'seasons-driver-standings', 'seasons-constructor-standings'].map(read),
);
const driverNames = new Map(drivers.map(({ id, name }) => [id, name]));
const teamNames = new Map(constructors.map(({ id, name }) => [id, name]));
const venues = new Map(circuits.map(({ id, fullName }) => [id, fullName]));
const raceNames = new Map(grandsPrix.map(({ id, name }) => [id, name]));
const names = { australia: 'Australia', japan: 'Japón', brazil: 'São Paulo', 'united-states': 'Estados Unidos', 'great-britain': 'Gran Bretaña', 'las-vegas': 'Las Vegas', italy: 'Italia', spain: 'España', mexico: 'México' };
const seasons = {};
const events = new Map();
for (const race of races) {
  const season = seasons[race.year] ??= { events: [], tables: [] };
  const event = {
    id: String(race.round), round: race.round, date: race.date,
    name: `GP de ${names[race.grandPrixId] ?? raceNames.get(race.grandPrixId) ?? race.officialName}`,
    venue: venues.get(race.circuitId), source, tables: [],
    schedule: [],
  };
  season.events.push(event);
  events.set(race.id, event);
  for (const [key, label] of [
    ['freePractice1', 'Libres 1'], ['freePractice2', 'Libres 2'], ['freePractice3', 'Libres 3'],
    ['freePractice4', 'Libres 4'], ['preQualifying', 'Preclasificación'], ['qualifying1', 'Clasificación 1'],
    ['qualifying2', 'Clasificación 2'], ['qualifying', 'Clasificación'], ['sprintQualifying', 'Clasificación sprint'],
    ['sprintRace', 'Sprint'], ['warmingUp', 'Warm-up'], ['', 'Carrera'],
  ]) {
    const date = key ? race[`${key}Date`] : race.date;
    const time = key ? race[`${key}Time`] : race.time;
    if (date && time) event.schedule.push([label, `${date}T${time}:00Z`]);
  }
  event.schedule.sort((a, b) => a[1].localeCompare(b[1]));
}

const common = [['Pos.', 'positionText'], ['N.º', 'driverNumber'], ['Piloto', 'driverId'], ['Equipo', 'constructorId']];
const timing = [['Tiempo', 'time'], ['Diferencia', 'gap'], ['Vueltas', 'laps']];
const definitions = [
  ['race-results', 'Carrera', [...timing, ['Grilla', 'gridPositionText'], ['Puestos ganados', 'positionsGained'], ['Puntos', 'points'], ['Incidencia', 'reasonRetired']]],
  ['qualifying-results', 'Clasificación', [...timing, ['Q1', 'q1'], ['Q2', 'q2'], ['Q3', 'q3']]],
  ['starting-grid-positions', 'Grilla de largada', [['Tiempo', 'time'], ['Clasificación', 'qualificationPositionText'], ['Penalización', 'gridPenalty']]],
  ['sprint-race-results', 'Sprint', [...timing, ['Puntos', 'points'], ['Incidencia', 'reasonRetired']]],
  ['sprint-qualifying-results', 'Clasificación sprint', [...timing, ['SQ1', 'sq1'], ['SQ2', 'sq2'], ['SQ3', 'sq3']]],
  ['sprint-starting-grid-positions', 'Grilla del sprint', [['Tiempo', 'time'], ['Penalización', 'gridPenalty']]],
  ['free-practice-1-results', 'Libres 1', timing], ['free-practice-2-results', 'Libres 2', timing],
  ['free-practice-3-results', 'Libres 3', timing], ['free-practice-4-results', 'Libres 4', timing],
  ['pre-qualifying-results', 'Preclasificación', timing], ['qualifying-1-results', 'Clasificación 1', timing],
  ['qualifying-2-results', 'Clasificación 2', timing], ['warming-up-results', 'Warm-up', timing],
  ['fastest-laps', 'Vueltas rápidas', [['Vuelta', 'lap'], ['Tiempo', 'time'], ['Diferencia', 'gap']]],
  ['pit-stops', 'Paradas en boxes', [['Parada', 'stop'], ['Vuelta', 'lap'], ['Tiempo', 'time']]],
  ['driver-of-the-day-results', 'Piloto del día', [['Votos', 'percentage']]],
  ['driver-standings', 'Campeonato de pilotos tras la fecha', [['Puntos', 'points']]],
  ['constructor-standings', 'Campeonato de constructores tras la fecha', [['Puntos', 'points']]],
];

function value(row, key) {
  if (key === 'driverId') return driverNames.get(row.driverId) ?? row.driverId ?? '';
  if (key === 'constructorId') return teamNames.get(row.constructorId) ?? row.constructorId ?? '';
  return row[key] ?? '';
}

function table(name, rows, fields) {
  const columns = fields.filter(([, key]) => rows.some((row) => value(row, key) !== ''));
  return { name, sourceUrl, columns: columns.map(([label]) => label), rows: rows.map((row) => columns.map(([, key]) => value(row, key))), rowEntities: rows.map((row) => ({ ...(row.driverId ? { driverId: row.driverId } : {}), ...(row.constructorId ? { constructorId: row.constructorId } : {}) })) };
}

for (const [file, name, fields] of definitions) {
  const byRace = Map.groupBy(await read(`races-${file}`), (row) => row.raceId);
  for (const [id, rows] of byRace) {
    events.get(id)?.tables.push(table(name, rows, [...common, ...fields]));
    if (file === 'race-results' && events.has(id)) {
      const winners = rows.filter((row) => row.positionNumber === 1);
      if (winners.length) events.get(id).winner = winners.map((row) => value(row, 'driverId')).join(' / ');
    }
  }
}

const stats = new Map();
const raceResults = await read('races-race-results');
for (const row of raceResults) {
  const key = `${row.year}:${row.driverId}`;
  const total = stats.get(key) ?? { wins: 0, podiums: 0 };
  if (row.positionNumber === 1) total.wins++;
  if (row.positionNumber >= 1 && row.positionNumber <= 3) total.podiums++;
  stats.set(key, total);
}

for (const [year, rows] of Map.groupBy(driverStandings, (row) => row.year)) {
  const enriched = rows.map((row) => ({ ...row, ...(stats.get(`${year}:${row.driverId}`) ?? { wins: 0, podiums: 0 }) }));
  seasons[year]?.tables.push(table('Pilotos', enriched, [['Pos.', 'positionText'], ['Piloto', 'driverId'], ['Puntos', 'points'], ['Victorias', 'wins'], ['Podios', 'podiums']]));
}
for (const [year, rows] of Map.groupBy(constructorStandings, (row) => row.year)) {
  seasons[year]?.tables.push(table('Constructores', rows, [['Pos.', 'positionText'], ['Equipo', 'constructorId'], ['Puntos', 'points']]));
}

const champions = [
  ...driverStandings.filter((row) => row.championshipWon && row.year < currentYear).map((row) => [row.year, 'Pilotos', value(row, 'driverId'), '']),
  ...constructorStandings.filter((row) => row.championshipWon && row.year < currentYear).map((row) => [row.year, 'Constructores', value(row, 'constructorId'), '']),
];
const [countries, engineManufacturers, chassis, entrantDrivers, entrantConstructors, entrantChassis] = await Promise.all(['countries', 'engine-manufacturers', 'chassis', 'seasons-entrants-drivers', 'seasons-entrants-constructors', 'seasons-entrants-chassis'].map(read));
for (const [year, season] of Object.entries(seasons)) season.f1 = buildF1Entities({ year: Number(year), drivers, constructors, countries, engineManufacturers, chassis, entrantDrivers, entrantConstructors, entrantChassis, driverStandings, constructorStandings, media, raceResults });
await writeArchive('f1', seasons, champions, [], { source: { name: 'F1DB', version: packageInfo.version, url: sourceUrl }, importer: 'f1db/3' });
