import { createHash } from 'node:crypto';
import { getSeason } from '@/lib/archive';
import { isCategory } from '@/lib/racing';

export async function GET(_request: Request, { params }: { params: Promise<{ category: string; year: string; id: string }> }) {
  const { category, year, id } = await params;
  if (!isCategory(category)) return Response.json({ error: 'Categoría desconocida.' }, { status: 404 });
  const season = await getSeason(category, year);
  const event = season?.events.find((event) => event.id === id);
  if (!event) return Response.json({ error: 'Fecha desconocida.' }, { status: 404 });
  const revision = createHash('sha256').update(JSON.stringify(event)).digest('hex');
  return Response.json({ key: `${category}:${year}:${id}`, category, year, event, revision }, { headers: { 'Cache-Control': 'no-store' } });
}
