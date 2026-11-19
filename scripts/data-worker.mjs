import { spawn } from 'node:child_process';
import { mkdir, open, unlink } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

const root = new URL('../', import.meta.url);
const lockPath = new URL('.work-import/data-worker.lock', root);
await mkdir(new URL('.work-import/', root), { recursive: true });
const lock = await open(lockPath, 'wx');
await lock.writeFile(String(process.pid));
const controller = new AbortController();
let child;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { controller.abort(); child?.kill(signal); });
try {
  while (!controller.signal.aborted) {
    await new Promise((resolve) => {
      child = spawn(process.execPath, ['scripts/update-data.mjs'], { stdio: 'inherit', cwd: root, windowsHide: true });
      child.once('error', (error) => { console.error(error.message); resolve(); });
      child.once('exit', resolve);
    });
    await setTimeout(15 * 60_000, undefined, { signal: controller.signal });
  }
} catch (error) { if (error.name !== 'AbortError') throw error; }
finally { await lock.close(); await unlink(lockPath); }
