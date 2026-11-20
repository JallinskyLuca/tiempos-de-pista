import { Overview } from '@/components/overview';
import { isCategory } from '@/lib/racing';

export default async function Home({ searchParams }: { searchParams: Promise<{ semana?: string; categoria?: string }> }) {
  const { semana, categoria } = await searchParams;
  return <Overview kind="home" selectedDate={typeof semana === 'string' ? semana : undefined} filter={isCategory(categoria) ? categoria : undefined} />;
}
