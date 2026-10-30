// Offline after the first visit, but always prefer the freshest copy when online.
// The cache name is versioned per build (build_book.py replaces the version), so every publish makes a
// new worker that takes over immediately and drops the old cache — updates land on the next reload.
const C = 'vocal-mastery-book-20261030015144';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); });

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)));   // drop every older build's cache
  await self.clients.claim();                                                // control open pages right away
})()));

self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith((async () => {
    try {
      // bypass the browser's HTTP cache for page loads so a new publish is never hidden behind max-age
      const fresh = await fetch(req, req.mode === 'navigate' ? {cache: 'reload'} : {});
      (await caches.open(C)).put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const hit = await caches.match(req);
      return hit || (req.mode === 'navigate' ? caches.match('index.html') : Promise.reject(err));
    }
  })());
});
