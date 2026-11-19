import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Tiempos de Pista', short_name: 'Tiempos',
    description: 'Agenda, resultados e historia del automovilismo en tu teléfono.',
    lang: 'es-AR', start_url: '/', scope: '/', display: 'standalone',
    background_color: '#0b1018', theme_color: '#101722',
    icons: [
      { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Calendario', url: '/calendario' },
      { name: 'Favoritos', url: '/favoritos' },
      { name: 'Mis descargas', url: '/offline.html' },
    ],
  };
}
