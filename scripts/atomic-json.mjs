import { mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
export async function replaceFile(source, destination) {
  for (let attempt = 0; ; attempt++) {
    try { await rename(source, destination); return; }
    catch (error) {
      if (attempt >= 6 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) throw error;
      await setTimeout(30 * 2 ** attempt);
    }
  }
}
export async function atomicJson(destination, value) {
  const file = fileURLToPath(destination);
  await mkdir(dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  try { await writeFile(temporary, JSON.stringify(value)); await replaceFile(temporary, file); }
  finally { await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
}
