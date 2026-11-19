import { createHash } from 'node:crypto';
import { getArchive } from '@/lib/archive';
import { getSyncStatus } from '@/lib/sync-status';

export async function GET() {
  const [archives, sync] = await Promise.all([Promise.all((['f1', 'tc', 'tn'] as const).map(async (category) => ({ category, index: await getArchive(category) }))), getSyncStatus()]);
  const revision = createHash('sha256').update(JSON.stringify(archives.map(({ index }) => index.revision ?? index.generatedAt ?? index.seasons))).digest('hex');
  return Response.json({ revision, categories: archives.map(({ category, index }) => ({ category, publishedAt: index.generatedAt, source: index.source, check: sync.categories[category] ?? null })) }, { headers: { 'Cache-Control': 'no-store' } });
}
