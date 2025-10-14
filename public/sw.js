
// Service Worker v6.0.9 - Estrategia Offline-First Completa
const CACHE_VERSION = 'cbt-journal-v6.0.9';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets críticos para precachear (rutas básicas)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json'
];

// Límites de caché
const CACHE_LIMITS = {
  dynamic: 50,
  images: 30
};

// ============================================
// INSTALACIÓN DEL SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
  console.log(`[SW] Instalando Service Worker ${CACHE_VERSION}...`);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precacheando assets críticos...');
        // Ignorar errores en precache, algunos assets pueden no existir en dev
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
            console.warn('[SW] Algunos assets de precache no se pudieron cargar, es normal en desarrollo.', err);
        });
      })
      .then(() => self.skipWaiting()) // Activar inmediatamente
      .catch((err) => console.error('[SW] Error en precache:', err))
  );
});

// ============================================
// ACTIVACIÓN Y LIMPIEZA DE CACHÉS ANTIGUOS
// ============================================
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activando Service Worker ${CACHE_VERSION}...`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('cbt-journal-') && ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(name))
            .map((name) => {
              console.log('[SW] Eliminando caché antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Tomar control de todas las páginas
  );
});

// ============================================
// ESTRATEGIA DE FETCH
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no-GET y extensiones de chrome/webpack
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension') || url.pathname.includes('/__nextjs_')) {
    return;
  }
  
  // Estrategia para páginas de Next.js (navegación)
  if (request.mode === 'navigate') {
     event.respondWith(
      fetch(request).catch(async () => {
        console.log('[SW] Network failed for navigation. Trying cache...');
        const cachedResponse = await caches.match(request);
        return cachedResponse || await caches.match('/'); // Fallback a la página principal
      })
    );
    return;
  }

  // Estrategia para assets estáticos (JS, CSS, WOFF2)
  if (url.pathname.includes('/_next/static/') || url.pathname.match(/\.(woff2?|ttf|eot)$/)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Estrategia para imágenes
  if (request.destination === 'image') {
     event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
     return;
  }
  
  // Estrategia por defecto (stale-while-revalidate para todo lo demás)
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});


// ============================================
// ESTRATEGIAS DE CACHÉ
// ============================================

/**
 * Cache-First: Intenta desde caché, si falla va a red. Ideal para assets que no cambian (imágenes, fuentes).
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
      trimCache(cacheName, CACHE_LIMITS[cacheName === IMAGE_CACHE ? 'images' : 'dynamic']);
    }
    return networkResponse;
  } catch (error) {
     console.error(`[SW] Network fetch failed in cache-first for ${request.url}`, error);
     // Para imágenes, podríamos devolver un placeholder SVG si quisiéramos.
     return new Response('', { status: 408, statusText: 'Request Timeout' });
  }
}

/**
 * Stale-While-Revalidate: Sirve desde caché inmediatamente si está disponible, 
 * luego actualiza el caché en segundo plano con la respuesta de red.
 * Ideal para assets de la app (JS, CSS, documentos) que pueden actualizarse.
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
            trimCache(cacheName, CACHE_LIMITS.dynamic);
        }
        return networkResponse;
    });

    return cachedResponse ? cachedResponse : fetchPromise.catch(async () => {
        // Si la red falla y no hay nada en caché, usar el fallback general
        if(request.mode === 'navigate') {
            return await caches.match('/') || await caches.match('/offline');
        }
        return new Response('', { status: 408, statusText: 'Request Timeout' });
    });
}


// ============================================
// UTILIDADES
// ============================================

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[SW] Trimmed ${deleteCount} items from ${cacheName}`);
  }
}

console.log(`[SW] Service Worker ${CACHE_VERSION} cargado correctamente.`);
