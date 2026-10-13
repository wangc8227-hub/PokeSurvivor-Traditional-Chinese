/* PokéSurvivor offline cache. Generated for the standalone Traditional Chinese build. */
'use strict';

const CACHE_PREFIX = 'pokesurvivor-offline-';
const CACHE_NAME = `${CACHE_PREFIX}2026-10-13-10`;
const MANIFEST_URL = new URL('precache-manifest.json', self.registration.scope).href;

async function announce(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) client.postMessage(message);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Precache manifest request failed: ${response.status}`);
    const files = await response.json();
    if (!Array.isArray(files) || !files.length) throw new Error('Precache manifest is empty');

    // Small batches avoid overwhelming mobile browsers while preserving a complete install.
    const batchSize = 32;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(async path => {
        const url = new URL(path, self.registration.scope);
        const request = new Request(url.href, { cache: 'reload' });
        const asset = await fetch(request);
        if (!asset.ok) throw new Error(`${path}: ${asset.status}`);
        await cache.put(request, asset);
      }));
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length) {
        throw new Error(`Could not cache ${failures.length} game files in batch ${Math.floor(i / batchSize) + 1}`);
      }
    }
    await announce({ type: 'POKESURVIVOR_OFFLINE_READY', total: files.length });
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(request);
    if (hit) return hit;

    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const fallback = await cache.match(new URL('index.html', self.registration.scope).href);
        if (fallback) return fallback;
      }
      return new Response('目前離線，且這個檔案尚未快取。請先連線開啟遊戲一次。', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
