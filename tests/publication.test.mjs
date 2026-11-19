import { describe, expect, it, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeArchive, validateSeason } from '../scripts/archive.mjs';

const temporary = [];
const fixture = () => ({ events: [{ id: '1', name: 'Una final', date: '2026-11-15', tables: [{ name: 'Final', columns: ['Pos.', 'Piloto'], rows: [['1', 'A'], ['1', 'B']] }] }], tables: [] });
afterEach(async () => { await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

describe('Publicación del archivo', () => {
  it('permite posiciones empatadas y rechaza otra temporada', () => {
    expect(() => validateSeason(2026, fixture())).not.toThrow();
    expect(() => validateSeason(2025, fixture())).toThrow('Fecha inválida');
  });
  it('conserva la revisión publicada si la siguiente perdió resultados', async () => {
    const path = await mkdtemp(join(tmpdir(), 'tiempos-publication-'));
    temporary.push(path);
    const directory = pathToFileURL(path + '/');
    await writeArchive('tc', { 2026: fixture() }, [], [], { directory });
    const before = await readFile(join(path, 'index.json'), 'utf8');
    const broken = fixture();
    broken.events[0].tables = [];
    await expect(writeArchive('tc', { 2026: broken }, [], [], { directory })).rejects.toThrow('Se perdieron las tablas');
    expect(await readFile(join(path, 'index.json'), 'utf8')).toBe(before);
    const corrected = fixture();
    corrected.events[0].tables[0].rows = [['1', 'B'], ['2', 'A']];
    await writeArchive('tc', { 2026: corrected }, [], [], { directory });
    const index = JSON.parse(await readFile(join(path, 'index.json'), 'utf8'));
    expect(index.revision).not.toBe(JSON.parse(before).revision);
    expect(JSON.parse(await readFile(join(path, index.seasons[0].file + '.json'), 'utf8')).events[0].tables[0].rows[0][1]).toBe('B');
  });
  it('valida todo el lote antes de escribir', async () => {
    const path = await mkdtemp(join(tmpdir(), 'tiempos-validation-'));
    temporary.push(path);
    const invalid = fixture();
    invalid.events[0].tables[0].rows.push(['3']);
    await expect(writeArchive('tc', { 2026: invalid }, [], [], { directory: pathToFileURL(path + '/') })).rejects.toThrow('Columnas inconsistentes');
    await expect(readFile(join(path, 'index.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('rechaza un documento que perdió una sesión aunque conserve la final', async () => {
    const path = await mkdtemp(join(tmpdir(), 'tiempos-session-'));
    temporary.push(path);
    const directory = pathToFileURL(path + '/');
    const full = fixture();
    full.events[0].tables.push({ ...full.events[0].tables[0], name: 'Clasificación' });
    await writeArchive('tc', { 2026: full }, [], [], { directory });
    const before = await readFile(join(path, 'index.json'), 'utf8');
    await expect(writeArchive('tc', { 2026: fixture() }, [], [], { directory })).rejects.toThrow('Se perdieron sesiones');
    expect(await readFile(join(path, 'index.json'), 'utf8')).toBe(before);
  });
  it('una nueva consulta sin cambios conserva la fecha y la revisión publicadas', async () => {
    const path = await mkdtemp(join(tmpdir(), 'tiempos-unchanged-'));
    temporary.push(path);
    const directory = pathToFileURL(path + '/');
    const season = fixture();
    season.events[0].tables[0].provenance = { fetchedAt: '2026-11-19T12:00:00Z' };
    await writeArchive('tc', { 2026: season }, [], [], { directory });
    const before = await readFile(join(path, 'index.json'), 'utf8');
    season.events[0].tables[0].provenance.fetchedAt = '2026-11-19T13:00:00Z';
    expect(await writeArchive('tc', { 2026: season }, [], [], { directory })).toMatchObject({ changed: false });
    expect(await readFile(join(path, 'index.json'), 'utf8')).toBe(before);
  });
  it('retiene una clasificación nacional cuando una respuesta pierde filas', async () => {
    const path = await mkdtemp(join(tmpdir(), 'tiempos-rows-'));
    temporary.push(path);
    const directory = pathToFileURL(path + '/');
    await writeArchive('tc', { 2026: fixture() }, [], [], { directory, strictResults: true });
    const partial = fixture();
    partial.events[0].tables[0].rows.pop();
    await expect(writeArchive('tc', { 2026: partial }, [], [], { directory, strictResults: true })).rejects.toThrow('Se redujo la clasificación');
  });
});
