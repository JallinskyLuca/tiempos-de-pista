import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readPublished } from './published.mjs';
import { updateWindow } from './update-policy.mjs';
import { atomicJson } from './atomic-json.mjs';

const root = new URL('../', import.meta.url);
const now = new Date();
const year = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric' }).format(now));
const forced = process.argv.includes('--force');
const gate = process.argv.includes('--check');
const selected = process.argv.find((arg) => arg.startsWith('--category='))?.split('=')[1];
if (selected && !['f1', 'tc', 'tn'].includes(selected)) throw new Error('Categoría inválida.');
const categories = selected ? [selected] : ['f1', 'tc', 'tn'];
const active = [];
for (const category of categories) {
  const season = await readPublished(category, year);
  const window = updateWindow(season?.events ?? [], category, now);
  const weekday = new Intl.DateTimeFormat('en', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short' }).format(now);
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Argentina/Buenos_Aires', hour: 'numeric', hourCycle: 'h23' }).format(now));
  if (!season && weekday === 'Fri' && hour === 9) { window.active = true; window.reason = 'calendario-pendiente'; }
  if (forced || window.active) active.push(category);
  console.log(category, forced ? 'consulta solicitada' : window.reason);
}
if (gate) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `active=${active.length > 0}\n`);
  process.exit(0);
}
if (!active.length) process.exit(0);

async function run(command, args, timeout = 10 * 60_000) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: fileURLToPath(root), stdio: 'inherit', timeout });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Proceso de importación terminado (${signal ?? code}).`)));
  });
}
const read = async (file) => JSON.parse(await readFile(new URL(file, root), 'utf8'));

async function updateF1() {
  const response = await fetch('https://api.github.com/repos/f1db/f1db/releases/latest', { headers: { 'User-Agent': 'TiemposDePista', Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`F1DB respondió HTTP ${response.status}.`);
  const release = await response.json();
  if (!/^v\d{4}\.\d+\.\d+$/.test(release.tag_name)) throw new Error('La versión de F1DB no es válida.');
  const current = await read('data/archive/f1/index.json');
  if (current.source?.version === release.tag_name.slice(1)) return;
  if (current.source?.version && release.tag_name.slice(1).localeCompare(current.source.version, 'en', { numeric: true }) < 0) throw new Error('La fuente devolvió una versión anterior.');
  const asset = release.assets.find((asset) => asset.name === 'f1db-json-splitted.tgz');
  const expectedUrl = `https://github.com/f1db/f1db/releases/download/${release.tag_name}/f1db-json-splitted.tgz`;
  if (!asset || asset.browser_download_url !== expectedUrl || asset.size > 25_000_000 || !/^sha256:[a-f\d]{64}$/.test(asset.digest ?? '')) throw new Error('Archivo de publicación sin integridad verificable.');
  const directory = new URL(`.work-import/releases/${release.tag_name}/`, root);
  const input = new URL('package/data/', directory);
  await mkdir(directory, { recursive: true });
  try { await access(new URL('.complete', directory)); }
  catch {
    const download = await fetch(expectedUrl, { signal: AbortSignal.timeout(60000) });
    if (!download.ok) throw new Error('No se pudo descargar F1DB.');
    const buffer = Buffer.from(await download.arrayBuffer());
    if (buffer.length !== asset.size || buffer.length > 25_000_000 || 'sha256:' + createHash('sha256').update(buffer).digest('hex') !== asset.digest) throw new Error('El archivo de F1DB no supera la comprobación de integridad.');
    const archive = new URL('source.tgz', directory);
    await writeFile(archive, buffer);
    await run('tar', ['-xzf', fileURLToPath(archive), '-C', fileURLToPath(directory), 'package/data', 'package/package.json']);
    await writeFile(new URL('.complete', directory), release.tag_name);
  }
  // Los retratos son opcionales: una falla no impide publicar resultados válidos.
  try { await run(process.execPath, ['scripts/import-f1-media.mjs', fileURLToPath(input)], 120000); }
  catch { console.warn('Se conservaron los retratos anteriores.'); }
  await run(process.execPath, ['scripts/import-f1.mjs', fileURLToPath(input)]);
}

const statePath = new URL('data/sync/status.json', root);
let state = { categories: {} };
try { state = await read('data/sync/status.json'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
let failed = false;
for (const category of active) {
  const previous = state.categories[category] ?? {};
  const before = await read(`data/archive/${category}/index.json`);
  try {
    if (category === 'f1') await updateF1();
    else await run(process.execPath, ['scripts/import-national.mjs', category, '--current', '--recent', '--refresh', '--year', String(year)]);
    const after = await read(`data/archive/${category}/index.json`);
    const changed = before.revision !== after.revision;
    state.categories[category] = { ...previous, state: changed ? 'updated' : 'unchanged', checkedAt: new Date().toISOString(), lastSuccessAt: new Date().toISOString(), publishedAt: after.generatedAt ?? null, failures: 0, error: null };
  } catch (error) {
    failed = true;
    console.error(category, error.message);
    state.categories[category] = { ...previous, state: 'error', checkedAt: new Date().toISOString(), publishedAt: before.generatedAt ?? null, failures: (previous.failures ?? 0) + 1, error: 'La fuente no entregó una actualización válida. Se conserva la última publicación.' };
  }
  await atomicJson(statePath, { ...state, intervalMinutes: process.env.GITHUB_ACTIONS ? 30 : 15 });
}
if (failed) process.exitCode = 1;
