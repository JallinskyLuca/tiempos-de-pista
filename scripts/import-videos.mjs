import { readFile } from 'node:fs/promises';
import { atomicJson } from './atomic-json.mjs';
import { readPublished } from './published.mjs';
import { associateEvent, parseVideoFeed } from './video-feed.mjs';

const root = new URL('../', import.meta.url);
const read = async (file) => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const channels = await read('data/media/channels.json');
const previous = await read('data/media/videos.json');
const requested = process.argv.find((arg) => arg.startsWith('--categories='))?.split('=')[1].split(',') ?? Object.keys(channels);
if (!requested.length || requested.some((category) => !Object.hasOwn(channels, category))) throw new Error('Categoría de video inválida.');
const categories = { ...previous.categories };
let failed = false;
for (const category of requested) {
  try {
    const channel = channels[category];
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok || Number(response.headers.get('content-length')) > 1_000_000) throw new Error(`Feed HTTP ${response.status}.`);
    // Leer con límite incluso si la respuesta no publica Content-Length.
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) { await reader.cancel(); throw new Error('Feed demasiado grande.'); }
      chunks.push(value);
    }
    const incoming = parseVideoFeed(Buffer.concat(chunks).toString('utf8'), channel, category);
    const editions = new Map();
    for (const year of new Set(incoming.map((video) => video.year))) editions.set(year, await readPublished(category, year));
    const videos = new Map(categories[category].map((video) => [video.id, video]));
    for (const video of incoming) {
      const eventId = associateEvent(video, editions.get(video.year)?.events ?? []);
      videos.set(video.id, { ...video, ...(eventId ? { eventId } : {}) });
    }
    categories[category] = [...videos.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 60);
    console.log(`${category}: ${incoming.length} resúmenes en el feed; ${categories[category].length} en biblioteca.`);
  } catch (error) { failed = true; console.error(`${category}: ${error.message} Se conserva la biblioteca anterior.`); }
}
if (JSON.stringify(categories) !== JSON.stringify(previous.categories)) await atomicJson(new URL('data/media/videos.json', root), { categories });
if (failed) process.exitCode = 1;
