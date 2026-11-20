import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Overview } from '@/components/overview';
import { categories, isCategory } from '@/lib/racing';

type Props = { params: Promise<{ categoria: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  if (!isCategory(categoria)) notFound();
  return { title: categories[categoria].name };
}

export default async function CategoryPage({ params, searchParams }: Props & { searchParams: Promise<{ semana?: string }> }) {
  const { categoria } = await params;
  if (!isCategory(categoria)) notFound();
  const { semana } = await searchParams;
  return <Overview kind="category" filter={categoria} selectedDate={typeof semana === 'string' ? semana : undefined} />;
}
