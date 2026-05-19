/**
 * Custom service worker additions.
 * next-pwa injects the main caching logic automatically.
 * This file handles the offline fallback and push events.
 */

// Offline fallback page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/offline.html').then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
  }
});
