'use client';

import Image from 'next/image';
import { useState } from 'react';

export function DriverAvatar({ name, photo, large = false }: { name: string; photo?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(' ').filter(Boolean).map((word) => word[0]).filter((_, index, all) => index === 0 || index === all.length - 1).join('');
  return <span className={`driver-avatar${large ? ' driver-avatar-large' : ''}`} aria-hidden="true">
    {photo && !failed ? <Image src={photo} alt="" width={large ? 120 : 48} height={large ? 120 : 48} unoptimized onError={() => setFailed(true)} /> : <span>{initials}</span>}
  </span>;
}
