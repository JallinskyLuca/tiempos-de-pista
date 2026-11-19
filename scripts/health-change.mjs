import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const fingerprint = (value) => JSON.stringify(['f1', 'tc', 'tn'].map((category) => {
  const state = value?.categories?.[category]?.state;
  return state === 'error' ? 'error' : state ? 'healthy' : 'unknown';
}));
let before = null, after = null;
try { before = JSON.parse(execFileSync('git', ['show', 'HEAD:data/sync/status.json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch { /* Primer estado publicado. */ }
try { after = JSON.parse(await readFile(new URL('../data/sync/status.json', import.meta.url), 'utf8')); } catch { /* Sin controles todavía. */ }
console.log(fingerprint(before) !== fingerprint(after));
