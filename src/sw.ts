/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import('workbox-build').ManifestEntry>;
};

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const MAX_ARTICLES = 50;
const MAX_IMAGES = 100;

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
    plugins: [new ExpirationPlugin({ maxEntries: MAX_ARTICLES })],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: MAX_IMAGES })],
  }),
);
