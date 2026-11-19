import { readFile, writeFile, mkdir, access, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import sharp from 'sharp';
import { identifyDriver } from './driver-identity.mjs';

const input = process.argv[2];
if (!input) throw new Error('Indicá el directorio package/data de F1DB.');
const year = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date()));
const json = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`OpenF1 respondió HTTP ${response.status}`);
  return response.json();
};
const sessions = await json(`https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`);
if (!Array.isArray(sessions)) throw new Error('Sesiones inválidas.');
const recent = sessions.filter((item) => !item.is_cancelled && Date.parse(item.date_end) < Date.now()).sort((a, b) => Date.parse(b.date_end) - Date.parse(a.date_end)).slice(0, 4);
const session = recent[0];
if (!session) throw new Error('No hay una carrera terminada para identificar los retratos.');
const drivers = JSON.parse(await readFile(join(input, 'f1db-drivers.json'), 'utf8'));
const photos = [];
for (const race of recent) {
  await setTimeout(400);
  const rows = await json(`https://api.openf1.org/v1/drivers?session_key=${race.session_key}`);
  if (!Array.isArray(rows)) throw new Error('Registro de pilotos inválido.');
  photos.push(...rows);
}
const directory = new URL('../public/pilotos/', import.meta.url);
await mkdir(directory, { recursive: true });
let previous;
try { previous = JSON.parse(await readFile(new URL('../data/f1-media.json', import.meta.url), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const byId = new Map((previous?.year === year ? previous.drivers : []).map((driver) => [driver.id, driver]));
const seen = new Set();
for (const item of photos) {
  const driver = identifyDriver(drivers, item);
  if (!driver || !item.headshot_url) continue;
  if (seen.has(driver.id)) continue;
  const url = new URL(item.headshot_url);
  if (url.protocol !== 'https:' || !['media.formula1.com', 'www.formula1.com'].includes(url.hostname)) continue;
  const hash = createHash('sha256').update(url.href).digest('hex').slice(0, 12);
  const filename = `${driver.id}-${year}-${hash}.webp`;
  const target = new URL(filename, directory);
  try { await access(target); }
  catch {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`No se pudo descargar el retrato de ${driver.name}.`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 2_000_000) throw new Error('Retrato demasiado grande.');
    const temporary = new URL(`${filename}.${randomUUID()}.tmp`, directory);
    await sharp(buffer, { limitInputPixels: 16_000_000 }).resize(240, 240, { fit: 'contain', background: '#00000000' }).webp({ quality: 82 }).toFile(fileURLToPath(temporary));
    await rename(temporary, target);
  }
  byId.set(driver.id, { id: driver.id, photo: '/pilotos/' + filename, color: item.team_colour, sourceUrl: url.href, sourceSessionKey: item.session_key });
  seen.add(driver.id);
}
const result = [...byId.values()];
if (result.length < 15) throw new Error('No se identificó una cantidad suficiente de retratos. Se conserva la edición anterior.');
const destination = new URL('../data/f1-media.json', import.meta.url);
const temporary = new URL('../data/f1-media.tmp', import.meta.url);
await writeFile(temporary, JSON.stringify({ year, sessionKey: session.session_key, fetchedAt: new Date().toISOString(), source: `https://api.openf1.org/v1/drivers?session_key=${session.session_key}`, drivers: result }));
await rename(temporary, destination);
console.log(result.length, 'retratos identificados y optimizados.');
