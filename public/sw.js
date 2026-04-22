// public/sw.js
const CACHE_NAME = 'cognit-lambda-cache-v1.4';
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use a network-first strategy for icons and manifest during install
        const iconRequests = urlsToCache.filter(url => url.includes('.png') || url.includes('.json') || url.includes('.ico'));
        const otherRequests = urlsToCache.filter(url => !iconRequests.includes(url));

        const cacheOtherAssets = cache.addAll(otherRequests);
        const fetchAndCacheIcons = Promise.all(
          iconRequests.map(url => 
            fetch(url, { cache: 'no-store' }).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              return Promise.resolve(); // Don't fail the whole install
            })
          )
        );

        return Promise.all([cacheOtherAssets, fetchAndCacheIcons]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate the service worker and remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Always try network first for navigation requests, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('/', responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(response => response || caches.match('/')).then(response => response || caches.match('/offline')))
    );
    return;
  }
  
  // For same-origin assets, use cache-first and populate cache after first online load.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
                const requestUrl = new URL(event.request.url);
                if (requestUrl.origin === self.location.origin && fetchResponse.ok) {
                    cache.put(event.request, fetchResponse.clone());
                }
                return fetchResponse;
            });
        });
      }).catch(() => {
        // If an asset is not in cache and network fails (e.g. an image),
        // we don't have a generic fallback, so the browser's default error will show.
      })
  );
});
