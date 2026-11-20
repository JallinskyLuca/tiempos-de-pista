import { expect, it } from 'vitest';
import { associateEvent, isRecap, parseVideoFeed } from '../scripts/video-feed.mjs';

const channel = { id: 'UCB_qr75-ydFVKSF9Dmo6izg' };
const xml = (id = channel.id, title = 'FP2 Highlights | 2026 Las Vegas Grand Prix') => `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><yt:channelId>${id}</yt:channelId><entry><yt:channelId>${id}</yt:channelId><yt:videoId>sKe57Zn66FU</yt:videoId><title>${title}</title><published>2026-11-20T06:20:02Z</published></entry></feed>`;
it('solo publica resúmenes del canal verificado y rechaza otro canal', () => {
  expect(parseVideoFeed(xml(), channel, 'f1', new Date('2026-11-20T12:00Z'))).toHaveLength(1);
  expect(parseVideoFeed(xml().replace(`<yt:channelId>${channel.id}</yt:channelId>`, `<yt:channelId>${channel.id.slice(2)}</yt:channelId>`), channel, 'f1', new Date('2026-11-20T12:00Z'))).toHaveLength(1);
  expect(() => parseVideoFeed(xml('otro'), channel, 'f1')).toThrow(/canal/);
  expect(parseVideoFeed(xml(channel.id, 'Entrevista'), channel, 'f1')).toEqual([]);
});
it('no mezcla TC con TC Pista, simuladores o contenidos de otras categorías', () => {
  expect(isRecap('tc', 'TC | Resumen de la final en Río Cuarto')).toBe(true);
  expect(isRecap('tc', 'TC Pista | Resumen de la final')).toBe(false);
  expect(isRecap('tc', 'Turismo Carretera eTC | Resumen virtual')).toBe(false);
  expect(isRecap('tn', 'El resumen de la Final de la Clase 2 en Concordia')).toBe(true);
});
it('asocia la fecha inequívoca, sin atribuir un resumen histórico al año actual', () => {
  const video = { title: 'FP1 Highlights | 2026 Las Vegas Grand Prix', publishedAt: '2026-11-20T02:41Z', year: 2026 };
  const events = [{ id: '21', name: 'GP de Las Vegas', date: '2026-11-22' }];
  expect(associateEvent(video, events)).toBe('21');
  expect(associateEvent({ ...video, year: 2025 }, events)).toBeUndefined();
  expect(associateEvent(video, [...events, { ...events[0], id: '22' }])).toBeUndefined();
});
it('preserva el año del contenido frente al año de publicación', () => {
  expect(parseVideoFeed(xml(channel.id, 'Extended Highlights | 2025 Las Vegas Grand Prix'), channel, 'f1', new Date('2026-11-20T12:00Z'))[0].year).toBe(2025);
});
