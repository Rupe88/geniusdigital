// Simple service worker for Sanskar Academy PWA
// - Caches core assets on install
// - Never applies cache-first to cross-origin requests (API on another host)
// - Admin/dashboard navigations are network-only (no broken offline fallback)

const CACHE_NAME = 'genius-digital-cache-v6';
const CORE_ASSETS = ['/', '/manifest.webmanifest?v=4', '/favicon.png?v=4', '/logo.png?v=4'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin (e.g. API on DigitalOcean): pass through only — no cache logic / no rejected respondWith
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Same-origin API & Next internals — always network
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.method !== 'GET') return;

  // Logged-in / sensitive areas: never serve stale offline shell (prevents SW "network error" + wrong HTML)
  if (request.mode === 'navigate') {
    const path = url.pathname;
    if (
      path.startsWith('/admin') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/payment') ||
      path.startsWith('/learn')
    ) {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/');
        if (cached) return cached;
        return new Response('You are offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
    return;
  }

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
