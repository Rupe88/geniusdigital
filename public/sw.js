// Simple service worker for Sanskar Academy PWA
// - Caches core assets on install
// - Serves cached assets when offline (network-first for navigation)

const CACHE_NAME = 'sanskar-academy-cache-v2';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  // Wait for client to send SKIP_WAITING (user clicked "Refresh" in update banner)
  // self.skipWaiting();
});

// When user clicks "Refresh" in update banner, activate the waiting worker
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls or Next.js data – always network (keeps auth/state correct in PWA)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
    event.respondWith(fetch(request));
    return;
  }

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Network-first for navigation requests (always get fresh HTML so auth state restores)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for other same-origin static assets only
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      });
    })
  );
});

