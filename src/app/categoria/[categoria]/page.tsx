import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getArchive } from '@/lib/archive';
import { categories, isCategory } from '@/lib/racing';

type Props = { params: Promise<{ categoria: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(categories).map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  if (!isCategory(categoria)) notFound();
  return { title: categories[categoria].name };
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  if (!isCategory(categoria)) notFound();
  const archive = await getArchive(categoria);
  redirect(`/categoria/${categoria}/archivo/${archive.seasons[0].year}`);
}
