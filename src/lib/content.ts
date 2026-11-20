import channels from '../../data/media/channels.json';
import library from '../../data/media/videos.json';
import news from '../../data/media/news.json';
import { type Category } from './racing';

export type OfficialVideo = { id: string; title: string; publishedAt: string; year: number; eventId?: string; category: Category };
export type NewsBrief = { slug: string; category: Category; title: string; publishedAt: string; summary: string; body: string[]; sourceName: string; sourceUrl: string; year: number; eventId?: string };
export const officialChannels = channels;

export function getVideos(category?: Category, event?: { year: number; id: string }): OfficialVideo[] {
  const content = library.categories as Record<Category, Omit<OfficialVideo, 'category'>[]>;
  return (category ? [category] : ['f1', 'tc', 'tn'] as Category[]).flatMap((id) => content[id].map((video) => ({ ...video, category: id })))
    .filter((video) => !event || video.year === event.year && video.eventId === event.id)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function getNews(category?: Category): NewsBrief[] {
  return (news as NewsBrief[]).filter((item) => !category || item.category === category).toSorted((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
