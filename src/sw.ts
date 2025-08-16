/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import('workbox-build').ManifestEntry>;
};

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const MAX_ARTICLES = 50;
const MAX_IMAGES = 100;

const articleQueue = new BackgroundSyncPlugin('article-queue', {
  maxRetentionTime: 24 * 60,
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request);
        const cache = await caches.open('articles');
        await cache.put(entry.request, response.clone());
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

registerRoute(
  ({ request, url }) => request.mode === 'navigate' && url.pathname === '/',
  new NetworkFirst({
    cacheName: 'app-shell',
  }),
);

registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' && url.pathname.startsWith('/reader/'),
  new NetworkFirst({
    cacheName: 'articles',
    plugins: [articleQueue, new ExpirationPlugin({ maxEntries: MAX_ARTICLES })],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: MAX_IMAGES })],
  }),
);
