/* Bokštas offline cache: serve from cache instantly, refresh it in the background */
const CACHE = 'bokstas-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './unbounded-latin.woff2', './unbounded-latin-ext.woff2',
  './manrope-latin-500.woff2', './manrope-latin-700.woff2', './manrope-latin-800.woff2',
  './manrope-latin-ext-500.woff2', './manrope-latin-ext-700.woff2', './manrope-latin-ext-800.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const fresh = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || fresh;
    })
  );
});
