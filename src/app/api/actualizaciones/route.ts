import { createHash } from 'node:crypto';
import { getArchive } from '@/lib/archive';
import { getSyncStatus } from '@/lib/sync-status';
import { getSessionIndex } from '@/lib/openf1';
import { getTelemetryArchive } from '@/lib/telemetry-archive';

export async function GET() {
  const [archives, sync] = await Promise.all([Promise.all((['f1', 'tc', 'tn'] as const).map(async (category) => ({ category, index: await getArchive(category) }))), getSyncStatus()]);
  const sessions = await getSessionIndex();
  const telemetry=await getTelemetryArchive();
  const revision = createHash('sha256').update(JSON.stringify([archives.map(({ index }) => index.revision ?? index.generatedAt ?? index.seasons),sessions.revision,telemetry.revision])).digest('hex');
  return Response.json({ revision, categories: archives.map(({ category, index }) => ({ category, publishedAt: index.generatedAt, source: index.source, check: sync.categories[category] ?? null })) }, { headers: { 'Cache-Control': 'no-store' } });
}
