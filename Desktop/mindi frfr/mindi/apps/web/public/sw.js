// =============================================================================
// MINDI — Service Worker (PWA)
// Caches shell routes for offline access.
// Network-first for API calls, cache-first for static assets.
// =============================================================================

const CACHE_NAME = 'mindi-v1';
const PRECACHE_ROUTES = ['/', '/dashboard', '/offline'];
const STATIC_EXTENSIONS = ['.js', '.css', '.woff2', '.png', '.svg', '.ico'];

// Install: pre-cache shell routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ROUTES);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API routes: network-only (never cache sensitive data)
// - Static assets: cache-first
// - Pages: network-first, fallback to cache, fallback to /offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls — always network
  if (url.pathname.startsWith('/api/')) {
    return; // Let browser handle normally
  }

  // Static assets: cache-first
  if (STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached ?? fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached ?? caches.match('/offline')
          )
        )
    );
  }
});

// Background sync — flush offline queue when connection restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'mindi-sync-queue') {
    event.waitUntil(
      // Signal to the app that sync should run
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SYNC_QUEUE_FLUSH' })
        );
      })
    );
  }
});
