import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';
import { CoffeeIcon } from '@/components/coffee-icon';
import { AppNav } from '@/components/app-nav';
import { PwaStatus } from '@/components/pwa-status';
import { ResultsUpdates } from '@/components/results-updates';

export const metadata: Metadata = {
  title: { default: 'Tiempos de Pista', template: '%s | Tiempos de Pista' },
  description: 'Agenda en hora argentina, resultados y campeonatos de TC, Fórmula 1 y TN.',
  appleWebApp: { capable: true, title: 'Tiempos de Pista', statusBarStyle: 'default' },
  icons: { icon: '/icons/app-192.png', apple: '/icons/apple-180.png' },
};
export const viewport: Viewport = { themeColor: '#101722', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <PwaStatus />
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <header className="masthead">
          <div className="shell masthead-inner">
            <Link href="/" className="wordmark">
              <span className="flag" aria-hidden="true" />
              Tiempos <span>de Pista</span>
            </Link>
            <div className="masthead-actions">
              <span className="timezone">Hora argentina <span>UTC−3</span></span>
              <Link className="coffee-link" href="/apoyar"><CoffeeIcon /><span>Cafecito</span></Link>
            </div>
          </div>
        </header>
        <div className="shell"><AppNav /></div>
        <main id="contenido" className="shell"><ResultsUpdates />{children}</main>
        <footer className="shell footer">Tiempos de Pista <Link href="/cobertura">Fuentes y cobertura</Link><span>Proyecto independiente de automovilismo</span></footer>
      </body>
    </html>
  );
}
