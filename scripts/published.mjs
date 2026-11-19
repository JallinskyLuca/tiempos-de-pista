import { readFile } from 'node:fs/promises';
const root = new URL('../data/archive/', import.meta.url);
export async function readPublished(category, year) {
  if (!['f1', 'tc', 'tn'].includes(category) || !/^\d{4}$/.test(String(year))) throw new Error('Archivo inválido.');
  try {
    const index = JSON.parse(await readFile(new URL(`${category}/index.json`, root), 'utf8'));
    const entry = index.seasons.find((entry) => entry.year === Number(year));
    if (!entry) return null;
    const file = entry.file && /^revisions\/[a-f\d]{64}$/.test(entry.file) ? entry.file : String(year);
    return JSON.parse(await readFile(new URL(`${category}/${file}.json`, root), 'utf8'));
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
