import { Overview } from '@/components/overview';
import { isCategory } from '@/lib/racing';

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ semana?: string; categoria?: string }> }) {
  const { semana, categoria } = await searchParams;
  return <Overview selectedDate={semana} filter={isCategory(categoria) ? categoria : undefined} />;
}
