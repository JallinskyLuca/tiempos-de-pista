import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { atomicJson } from './atomic-json.mjs';
import { readPublished } from './published.mjs';
import { historicalSession, normalizeSession } from './openf1-model.mjs';
import { freeAccessWindow } from './openf1-access.mjs';

const root = new URL('../data/openf1/', import.meta.url);
const now = new Date();
const year = Number(process.argv.find((arg) => arg.startsWith('--year='))?.split('=')[1] ?? new Intl.DateTimeFormat('en', { timeZone:'America/Argentina/Buenos_Aires', year:'numeric' }).format(now));
if (!Number.isInteger(year) || year < 2023 || year > now.getUTCFullYear()) throw new Error('Año OpenF1 inválido.');
const round = process.argv.find((arg) => arg.startsWith('--round='))?.split('=')[1];
const season = await readPublished('f1', year);
const access=freeAccessWindow(season?.events??[],now);
if(!access.allowed){console.log(`OpenF1: pausa global de acceso gratuito hasta ${access.retryAt}. Se conserva la edición publicada.`);process.exit(0);}
const events = season?.events.filter((event) => round ? String(event.round) === round : Math.abs(Date.parse(event.date) - now.getTime()) < 7 * 86_400_000) ?? [];
if (!events.length) { console.log('OpenF1: no hay una fecha para consultar.'); process.exit(0); }
const previous = JSON.parse(await readFile(new URL('index.json', root), 'utf8'));
const notes = JSON.parse(await readFile(new URL('notes.json', root), 'utf8'));
let nextRequest = 0;
async function query(endpoint, allow404 = false) {
  await setTimeout(Math.max(0, nextRequest - Date.now()));
  nextRequest = Date.now() + 2200;
  const response = await fetch('https://api.openf1.org/v1/' + endpoint, { redirect:'error', signal:AbortSignal.timeout(25000) });
  if (response.status === 404 && allow404) return [];
  if (!response.ok) throw new Error(`OpenF1 HTTP ${response.status}; se conserva la publicación.`);
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.byteLength; if (size > 5_000_000) throw new Error('Respuesta OpenF1 demasiado grande.'); chunks.push(chunk); }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!Array.isArray(data)) throw new Error('Respuesta OpenF1 inválida.');
  return data;
}
const sessions = await query(`sessions?year=${year}`);
const entries = new Map(previous.sessions.map((session) => [session.key, session]));
let changed = false;
for (const meta of sessions) {
  if (!historicalSession(meta, now)) continue;
  const matches = events.filter((event) => event.schedule?.some(([, start]) => Math.abs(Date.parse(start) - Date.parse(meta.date_start)) < 5 * 60_000));
  if (matches.length !== 1) continue;
  const event = matches[0];
  const results = await query(`session_result?session_key=${meta.session_key}`, Boolean(notes[meta.session_key]));
  const drivers = await query(`drivers?session_key=${meta.session_key}`);
  const laps = await query(`laps?session_key=${meta.session_key}`);
  const normalized = normalizeSession(meta, drivers, results, laps, notes[meta.session_key]);
  const digest = createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  const old = entries.get(meta.session_key);
  if (old?.revision === digest) continue;
  if (old) {
    const prior = JSON.parse(await readFile(new URL(`sessions/${old.file}.json`, root), 'utf8'));
    if (normalized.results.length < prior.results.length || normalized.laps.length < prior.laps.length) throw new Error('La nueva sesión perdió registros; requiere revisión.');
  }
  const publishedAt = now.toISOString();
  await atomicJson(new URL(`sessions/${digest}.json`, root), { ...normalized, publishedAt });
  entries.set(meta.session_key, { key:meta.session_key, year, eventId:event.id, name:normalized.name, endsAt:meta.date_end, file:digest, revision:digest, publishedAt });
  changed = true;
  console.log(`OpenF1: ${event.name}, ${normalized.name}: ${normalized.results.length} resultados y ${normalized.laps.length} vueltas.`);
}
if (changed) {
  const list = [...entries.values()].sort((a,b) => a.key-b.key);
  await atomicJson(new URL('index.json', root), { revision:createHash('sha256').update(JSON.stringify(list)).digest('hex'), sessions:list });
} else console.log('OpenF1: sin cambios en las sesiones históricas consultadas.');
