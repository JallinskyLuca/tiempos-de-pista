'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/', 'Inicio', 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z'],
  ['/calendario', 'Calendario', 'M4 5h16v16H4ZM8 3v4m8-4v4M4 10h16'],
  ['/archivo', 'Archivo', 'M4 4h16v5H4Zm2 5v12h12V9m-8 5h4'],
  ['/favoritos', 'Favoritos', 'm12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z'],
  ['/descargas', 'Mi app', 'M5 3h14v18H5Zm4 15h6m-3-12v7m-3-3 3 3 3-3'],
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Navegación principal">
      {links.map(([href, label, path]) => <Link href={href} key={href} aria-current={pathname === href || href === '/archivo' && pathname.includes('/archivo/') ? 'page' : undefined}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={path} /></svg><span>{label}</span></Link>)}
    </nav>
  );
}
