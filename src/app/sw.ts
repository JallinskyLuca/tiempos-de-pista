/// <reference lib="webworker" />

import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from 'serwist';

declare const self: ServiceWorkerGlobalScope & SerwistGlobalConfig & { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request, url }) => url.origin === self.location.origin && request.mode === 'navigate' && !/^\/(api|admin)(\/|$)/.test(url.pathname),
      handler: new NetworkOnly({ networkTimeoutSeconds: 5 }),
    },
    {
      matcher: ({ request, url }) => url.origin === self.location.origin && /^\/(?:_next\/static\/|icons\/|competencias\/)/.test(url.pathname) && /\.(?:woff2?|png|svg|jpg|css|js)$/.test(url.pathname) && request.destination !== 'document',
      handler: new CacheFirst({ cacheName: 'tiempos-public-assets-v1', plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 })] }),
    },
  ],
  fallbacks: { entries: [{ url: '/offline.html', matcher: ({ request }) => request.mode === 'navigate' }] },
});

serwist.addEventListeners();
