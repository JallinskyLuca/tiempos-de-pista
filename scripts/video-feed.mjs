import { load } from 'cheerio';

export function isRecap(category, title) {
  const text = normalize(title);
  if (category === 'f1') return /\bhighlights\b/.test(text);
  if (!/\bresumen\b/.test(text)) return false;
  if (category === 'tc') return /(?:^tc\s*[|:–-]|turismo carretera)/.test(text) && !/tc pista|mouras|pick.?up|\betc\b|esport|virtual|simul/.test(text);
  return category === 'tn' && /\b(final|carrera|clase)\b/.test(text);
}

export function normalize(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9|:–-]+/g, ' ').trim();
}

export function parseVideoFeed(xml, channel, category, now = new Date()) {
  if (Buffer.byteLength(xml) > 1_000_000) throw new Error('Feed demasiado grande.');
  const $ = load(xml, { xmlMode: true });
  const feedChannel = $('feed > yt\\:channelId').text();
  // YouTube omite el prefijo UC en el identificador raíz de algunos feeds.
  if (![channel.id, channel.id.slice(2)].includes(feedChannel)) throw new Error('El feed no pertenece al canal oficial esperado.');
  const entries = $('entry').toArray();
  if (!entries.length || entries.length > 100) throw new Error('Feed vacío o inválido.');
  return entries.flatMap((entry) => {
    const node = $(entry);
    const id = node.find('yt\\:videoId').text();
    const title = node.find('title').first().text().trim();
    const publishedAt = node.find('published').text();
    if (node.find('yt\\:channelId').text() !== channel.id || !/^[\w-]{11}$/.test(id) || !title || title.length > 300 || !Number.isFinite(Date.parse(publishedAt))) throw new Error('Publicación inválida.');
    if (!isRecap(category, title) || Date.parse(publishedAt) > now.getTime() + 300_000) return [];
    return [{ id, title, publishedAt, year: Number(title.match(/\b(20\d{2})\b/)?.[1] ?? publishedAt.slice(0, 4)) }];
  });
}

export function associateEvent(video, events) {
  const text = normalize(video.title);
  const matches = events.filter((event) => {
    const name = normalize(event.name).replace(/^(gp de |autodromo ciudad de |autodromo |circuito )/, '');
    const days = (Date.parse(video.publishedAt) - Date.parse(event.date)) / 86_400_000;
    return name.length >= 4 && text.includes(name) && Number(event.date.slice(0, 4)) === video.year && days >= -5 && days <= 21;
  });
  return matches.length === 1 ? matches[0].id : undefined;
}
