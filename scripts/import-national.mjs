import { load } from 'cheerio';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { writeArchive } from './archive.mjs';
import { importOptions } from './import-options.mjs';
import { readPublished } from './published.mjs';

const cache = new URL('../.work-import/cache/', import.meta.url);
await mkdir(cache, { recursive: true });
const options = importOptions(process.argv.slice(2));
const { year, through } = options;
const previous = options.recent ? await readPublished(options.category, year) : null;
const recentFrom = new Date(Date.parse(through + 'T12:00:00Z') - 3 * 86400000).toISOString().slice(0, 10);
const provenance = new Map();
const failures = [];
const actc = 'https://tiempos.actc.org.ar';
const apat = 'https://apat.org.ar';
const clean = (text) => text.trim().replace(/\s+/g, ' ');
const cleanTitle = (text) => {
  const title = clean(text);
  return title === title.toUpperCase() ? title[0]?.toUpperCase() + title.slice(1).toLowerCase() : title;
};

async function fetchPage(url) {
  const file = new URL(createHash('sha256').update(url).digest('hex') + '.html', cache);
  try {
    const info = await stat(file);
    if (!options.refresh && Date.now() - info.mtimeMs < 24 * 60 * 60 * 1000) {
      const body = await readFile(file, 'utf8');
      if (!/<title>\s*(?:One moment|Just a moment)/i.test(body)) {
        provenance.set(url, { url, fetchedAt: info.mtime.toISOString(), sha256: createHash('sha256').update(body).digest('hex') });
        return load(body);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  let failure;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: { 'User-Agent': 'TiemposDePista/0.1 archive import' } });
      if (response.ok) {
        const body = await response.text();
        if (body.length > 8_000_000 || !body.toLowerCase().includes('<html') || /<title>\s*(?:One moment|Just a moment)/i.test(body)) throw new Error('La fuente no entregó el documento de resultados.');
        await writeFile(file, body);
        provenance.set(url, { url, fetchedAt: new Date().toISOString(), sha256: createHash('sha256').update(body).digest('hex') });
        return load(body);
      }
      failure = `HTTP ${response.status}`;
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) { failure = error.message; }
    await delay(800);
  }
  console.warn(url, failure);
  failures.push(url);
  return null;
}

async function pool(items, callback) {
  let offset = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (offset < items.length) {
      const item = items[offset++];
      await callback(item);
      await delay(130);
    }
  }));
}

function nextPageData($, key) {
  const payload = $('script').toArray().flatMap((element) => {
    const script = $(element).html();
    if (!script?.startsWith('self.__next_f.push(')) return [];
    try { return [JSON.parse(script.slice(19, -1))[1]]; } catch { return []; }
  }).join('');
  const line = payload.split('\n').find((line) => line.includes(`"${key}":[{`));
  if (!line) return [];
  try { return JSON.parse(line.slice(line.indexOf(':') + 1))[3][key] ?? []; } catch { return []; }
}

function tableFromHtml($, element, name, url) {
  const headers = $(element).find('thead tr').first().children().toArray().map((cell) => clean($(cell).text()));
  const rows = $(element).find('tbody tr').toArray()
    .filter((row) => $(row).children().length >= headers.length && !$(row).children('[colspan]').length)
    .map((row) => $(row).children().toArray().map((cell) => {
      const copy = $(cell).clone();
      copy.find('button, .d-md-none, svg, script, .trophy-wins').remove();
      return clean(copy.text());
    }));
  if (headers.length < 2 || !rows.length) return null;
  const indexes = headers.flatMap((header, index) => header && rows.some((row) => row[index]) ? [index] : []);
  if (headers.join('|') === 'P|N°|Piloto|Marca|Tiempo total|Dif.|Vtas|' && rows.slice(0, 3).every((row) => /^\d+$/.test(row[4]) && /^\+?\d+:/.test(row[5]))) {
    headers.splice(4, 3, 'Vueltas', 'Tiempo total', 'Diferencia');
    for (const row of rows) if (row[5]?.startsWith('+') && /^\+\d+:/.test(row[5])) row[5] = row[5].slice(1);
  }
  const columns = indexes.map((index) => headers[index]);
  return {
    id: createHash('sha256').update(url + name).digest('hex').slice(0, 20),
    name, sourceUrl: url, provenance: provenance.get(url), columns,
    rows: rows.map((row) => indexes.map((index) => row[index].replace(/^(\d+);(?=\d{2}\.\d{3}$)/, '$1:'))),
  };
}

async function importTc() {
  const calendarUrl = 'https://actc.org.ar/tc/calendario';
  const calendar = await fetchPage(calendarUrl);
  const dates = new Map();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  if (calendar) calendar('article h3').each((_, element) => {
    const title = clean(calendar(element).text());
    const [, round, name] = title.match(/Fecha (\d+)\s*[—–·-]\s*(.+)/i) ?? [];
    const [, day, month, season] = calendar(element).closest('article').text().match(/(\d{2})\s+(\p{L}{3})\s+(20\d{2})/u) ?? [];
    if (round && months.includes(month) && Number(season) === year) dates.set(Number(round), { id: round, round: Number(round), name: cleanTitle(name), date: `${season}-${String(months.indexOf(month) + 1).padStart(2, '0')}-${day}`, source: 'ACTC', tables: [] });
  });
  if (!dates.size) throw new Error(`El calendario de ACTC no corresponde a ${year}.`);

  const archiveUrl = actc + '/resultados';
  const archive = await fetchPage(archiveUrl);
  if (!archive) throw new Error('El archivo de ACTC no respondió.');
  const jobs = [];
  const cards = archive('.acc-item[data-tab="TC"]').toArray();
  cards.forEach((element, index) => {
    const card = archive(element);
    const title = card.find('.acc-cat').first().clone();
    title.children().remove();
    const explicitRound = clean(title.text()).match(/(?:fecha\s*)?(\d{1,2})/i)?.[1];
    const round = explicitRound ? Number(explicitRound) : cards.length - index;
    const [day, month] = clean(card.find('.result-date').first().text()).split('/');
    const event = dates.get(round) ?? { id: String(round), round, date: `${year}-${month}-${day}`, name: cleanTitle(title.text()), source: 'ACTC', tables: [] };
    dates.set(round, event);
    if (event.date > through || (options.recent && event.date < recentFrom)) return;
    card.find('.result-row a.ver').each((_, link) => {
      const href = archive(link).attr('href');
      const name = cleanTitle(archive(link).closest('.result-row').find('.result-title').text());
      if (/^\/resultados\/\d+\/ver$/.test(href ?? '')) jobs.push({ event, name, url: actc + href });
    });
  });
  if (options.recent) for (const event of dates.values()) {
    const old = previous?.events.find((item) => item.id === event.id);
    if (old && event.date < recentFrom) { event.tables = old.tables; event.winner = old.winner; event.winnerCar = old.winnerCar; }
    if (old?.schedule && !event.schedule) event.schedule = old.schedule;
  }
  const sessions = new Map();
  await pool(jobs, async ({ url, name }) => {
    const $ = await fetchPage(url);
    if (!$) return;
    const tables = $('table.rv-table').toArray().map((element) => tableFromHtml($, element, name, url)).filter(Boolean);
    sessions.set(url, tables);
  });
  for (const { event, url } of jobs) {
    for (const table of sessions.get(url) ?? []) {
      if (!event.tables.some((previous) => previous.name === table.name && JSON.stringify(previous.rows) === JSON.stringify(table.rows))) event.tables.push(table);
    }
  }
  for (const event of dates.values()) {
    event.tables.sort((a, b) => Number(isFinal(b.name)) - Number(isFinal(a.name)));
    const final = event.tables.find((table) => isFinal(table.name) && table.columns.includes('Marca') && table.columns.includes('Piloto'));
    if (final) {
      event.winner = final.rows[0][final.columns.indexOf('Piloto')];
      event.winnerCar = final.rows[0][final.columns.indexOf('Marca')];
    }
  }
  const rioCuarto = year === 2026 ? dates.get(14) : null;
  if (rioCuarto) rioCuarto.schedule = [
    ['Entrenamiento 1', '2026-11-14T13:10:00Z'], ['Entrenamiento 2', '2026-11-14T15:05:00Z'],
    ['Clasificación', '2026-11-14T19:03:00Z'], ['Serie 1', '2026-11-15T13:55:00Z'],
    ['Serie 2', '2026-11-15T14:20:00Z'], ['Serie 3', '2026-11-15T14:45:00Z'], ['Final', '2026-11-15T17:00:00Z'],
  ];
  const seasons = { [year]: { events: [...dates.values()].sort((a, b) => a.round - b.round), tables: [] } };
  const reference = await fetchPage(`${actc}/tc/campeonato?year=${year}`);
  const years = options.onlyCurrent ? [year] : reference ? [...new Set(reference('select option').toArray().map((option) => Number(reference(option).attr('value'))).filter((value) => value >= 1900 && value <= year))] : [year];
  const champions = [];
  await pool(years, async (season) => {
    const data = seasons[season] ??= { events: [], tables: [] };
    for (const [path, name] of [['tc', 'Campeonato general'], ['copa-de-oro-tc', 'Copa de Oro']]) {
      const sourceUrl = `${actc}/${path}/campeonato?year=${season}`;
      const $ = await fetchPage(sourceUrl);
      if (!$) continue;
      const header = $('table.camp-table thead tr').first();
      const rounds = header.children().toArray().slice(3).map((element) => clean($(element).find('.camp-date-title').text() || $(element).text()).replace(/Clasif.*$/i, '').trim());
      const rows = $('table.camp-table tbody tr').toArray().filter((row) => $(row).find('.piloto-name').length).map((row) => {
        const cells = $(row).children().toArray().map((cell) => clean($(cell).text()));
        return [cells[0], clean($(row).find('.piloto-name').text()), cells[2], ...rounds.map((_, index) => cells[6 + index * 4] ?? '')];
      });
      if (rows.length) data.tables.push({ name, sourceUrl, provenance: provenance.get(sourceUrl), columns: ['Pos.', 'Piloto', 'Puntos', ...rounds], rows });
      if (path === 'tc' && season < year) {
        const winner = $('table.camp-table tbody tr').toArray().find((row) => $(row).find('.piloto-name').length && /Campeón/i.test($(row).children().eq(1).text()));
        if (winner) champions.push([season, 'Turismo Carretera', clean($(winner).find('.piloto-name').text()), '']);
      }
      if (path === 'tc' && data.events.length === 0) {
        for (const [index, round] of rounds.reverse().entries()) {
          const [, day, month, location] = round.match(/^(\d{2})\/(\d{2})\s+(.+)/) ?? [];
          if (day && month) data.events.push({ id: String(index + 1), round: index + 1, date: `${season}-${month}-${day}`, name: location, source: 'ACTC', tables: [] });
        }
      }
    }
  });
  const winnersUrl = 'https://actc.org.ar/institucional/ganadores';
  const winnersPage = options.onlyCurrent ? null : await fetchPage(winnersUrl);
  if (winnersPage) {
    const rows = nextPageData(winnersPage, 'items').flatMap((race) => {
      const [, day, month, yearLabel] = race.dateLabel.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/) ?? [];
      if (!race.active) return [];
      const season = yearLabel ? yearLabel.length === 4 ? Number(yearLabel) : Math.floor(race.year / 100) * 100 + Number(yearLabel) : race.year;
      const date = day && month ? `${season}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : race.raceDate?.slice(0, 10);
      if (!date?.startsWith(String(season)) || season < 1937 || season > year || !Number.isFinite(Date.parse(date))) return [];
      return [{ ...race, season, date }];
    });
    for (const [season, winners] of Map.groupBy(rows, (row) => row.season)) {
      const data = seasons[season] ??= { events: [], tables: [] };
      const hasCalendar = data.events.length > 0;
      for (const [index, winner] of winners.entries()) {
        const event = hasCalendar ? data.events.find((event) => event.date === winner.date) : undefined;
        if (event) {
          event.winner ??= winner.winnerName;
          event.winnerCar ??= winner.brand;
        } else if (!hasCalendar) {
          data.events.push({ id: `${winner.raceNumber}-${index + 1}`, round: index + 1, date: winner.date, name: winner.raceName, source: 'ACTC', tables: [], winner: winner.winnerName, winnerCar: winner.brand });
        }
      }
    }
  }
  const hallUrl = 'https://actc.org.ar/institucional/campeones';
  const hall = options.onlyCurrent ? null : await fetchPage(hallUrl);
  const roster = hall ? nextPageData(hall, 'initialChampions').filter((row) => row.active).map((row) => [`${row.firstName} ${row.lastName}`, row.championships, row.wins, row.brand]) : [];
  const history = roster.length ? [{ name: 'Pilotos campeones de TC', columns: ['Piloto', 'Títulos', 'Victorias', 'Marca'], rows: roster.sort((a, b) => b[1] - a[1]) }] : [];
  if (failures.length) throw new Error(`Publicación cancelada. Fallaron ${failures.length} fuentes.`);
  await writeArchive('tc', seasons, champions.sort((a, b) => b[0] - a[0]), history, { merge: options.onlyCurrent, strictResults: true, through, importer: 'national/3' });
}

function isFinal(name) {
  return /^final\b/i.test(name) && !/parcial|vuelta|grilla/i.test(name);
}

async function importTn() {
  const home = await fetchPage(apat + '/resultados/historico');
  if (!home) throw new Error('El archivo de APAT no respondió.');
  const years = options.onlyCurrent ? [year] : home('#selectorAnio option').toArray().map((item) => Number(home(item).attr('value'))).filter((season) => season <= year);
  const seasons = {};
  const jobs = [];
  await pool(years, async (season) => {
    const page = await fetchPage(`${apat}/resultados/historico/${season}`);
    if (!page) return;
    const heading = clean(page('h1').first().text());
    if (!heading.includes(String(season))) throw new Error(`APAT devolvió otra temporada para ${season}.`);
    const events = page('a[href^="/resultados/c2/"]').toArray().flatMap((link) => {
      const href = page(link).attr('href');
      const date = href.split('/').at(-1);
      const content = page(link).closest('.carrera-info-content');
      if (!date?.startsWith(`${season}-`) || !content.length) return [];
      const name = clean(content.find('.carrera-circuito-nombre').text());
      return [{ id: date, date, name, venue: clean(content.find('.carrera-ubicacion').text()), source: 'APAT', tables: [] }];
    }).reverse();
    events.forEach((event, index) => {
      event.round = index + 1;
      if (options.recent && event.date < recentFrom) event.tables = previous?.events.find((old) => old.id === event.id)?.tables ?? [];
      else if (event.date <= through) jobs.push({ event, classNumber: 2 }, { event, classNumber: 3 });
    });
    const data = seasons[season] = { events, tables: [] };
    if (season === year) {
      for (const classNumber of [2, 3]) {
        const url = `${apat}/campeonato/ranking/c${classNumber}`;
        const $ = await fetchPage(url);
        if (!$) continue;
        const table = tableFromHtml($, $('table.table-hover').first(), `Clase ${classNumber}`, url);
        if (table) data.tables.push(table);
      }
    }
  });
  const results = new Map();
  await pool(jobs, async ({ event, classNumber }) => {
    const url = `${apat}/resultados/c${classNumber}/${event.date}`;
    const $ = await fetchPage(url);
    if (!$) return;
    const tables = $('table.table-hover').toArray().map((element, index) => {
      const card = $(element).closest('.card');
      const heading = clean(card.prevAll('h2,h3,h4,h5,h6').first().text() || card.parent().children('h2,h3,h4,h5,h6').first().text());
      const title = heading ? cleanTitle(heading).replace(/\s+c[23]$/i, '') : index === 0 ? 'Final' : `Resultados ${index + 1}`;
      const table = tableFromHtml($, element, title, url);
      if (table) table.group = `Clase ${classNumber}`;
      return table;
    }).filter(Boolean);
    results.set(url, tables);
  });
  for (const { event, classNumber } of jobs) event.tables.push(...(results.get(`${apat}/resultados/c${classNumber}/${event.date}`) ?? []));

  const champions = [];
  const roster = options.onlyCurrent ? null : await fetchPage(apat + '/noticias/detalle/campeones-del-tn');
  if (roster) {
    let season = 0;
    roster('table').first().find('tr').each((_, row) => {
      const cells = roster(row).children().toArray().map((cell) => clean(roster(cell).text()));
      if (cells.length === 4 && /^\d{4}\b/.test(cells[0])) season = Number(cells.shift().slice(0, 4));
      if (season && cells.length === 3 && /^Clase/.test(cells[0])) champions.push([season, ...cells]);
    });
  }
  if (failures.length) throw new Error(`Publicación cancelada. Fallaron ${failures.length} fuentes.`);
  await writeArchive('tn', seasons, champions, [], { merge: options.onlyCurrent, strictResults: true, through, importer: 'national/3' });
}

const category = process.argv[2];
if (category === 'tc') await importTc();
else if (category === 'tn') await importTn();
else throw new Error('Indicá tc o tn.');
