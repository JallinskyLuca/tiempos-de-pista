import { getSeason } from '@/lib/archive';
import { isCategory } from '@/lib/racing';
import { eventCalendar } from '@/lib/ical';

export async function GET(_request: Request, { params }: { params: Promise<{ category: string; year: string; id: string }> }) {
  const { category, year, id } = await params;
  if (!isCategory(category)) return new Response('Categoría desconocida', { status: 404 });
  const season = await getSeason(category, year);
  const event = season?.events.find((event) => event.id === id);
  if (!event) return new Response('Fecha desconocida', { status: 404 });
  return new Response(eventCalendar(category, year, event), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${category}-${year}-${event.round}.ics"`, 'Cache-Control': 'no-store' } });
}
