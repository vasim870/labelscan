// LabelScan Service Worker - Fast Cache & Offline Support
const CACHE_NAME = 'labelscan-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/data.js',
  '/js/rules-engine.js',
  '/js/scanner.js',
  '/js/map.js',
  '/js/grievance.js',
  '/js/dashboard.js',
  '/js/app.js',
  '/assets/icon.svg',
  '/assets/compliant_pack.jpg',
  '/assets/dual_mrp_pack.jpg',
  '/assets/missing_usp_pack.jpg',
  '/assets/imported_missing_origin.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
