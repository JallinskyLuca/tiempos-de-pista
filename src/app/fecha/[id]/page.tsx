import { notFound, permanentRedirect } from 'next/navigation';
import { races } from '@/lib/edition';
import { archiveRaceHref } from '@/lib/racing';

export default async function LegacyRacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const race = races.find((race) => race.id === id);
  if (!race) notFound();
  permanentRedirect(archiveRaceHref(race));
}
