'use client';

import { useId, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function SessionPicker({ sessions, active, group }: { sessions: { index: number; name: string }[]; active: number; group?: string }) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="session-picker"><label htmlFor={id}>{pending ? 'Cargando sesión…' : 'Elegí una sesión o estadística'}</label><select id={id} name="sesion" value={active} disabled={pending} onChange={(event) => { const query = new URLSearchParams({ sesion: event.target.value }); if (group) query.set('clase', group); startTransition(() => router.push(`?${query}#resultado`, { scroll: false })); }}>{sessions.map((session) => <option key={session.index} value={session.index}>{session.name}</option>)}</select></div>;
}
