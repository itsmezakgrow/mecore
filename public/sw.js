const CACHE_NAME = 'core-os-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clientsClaim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests for same-origin static assets
  if (e.request.method !== 'GET') return;
  
  try {
    const url = new URL(e.request.url);
    // Ignore cross-origin requests (e.g. firestore.googleapis.com, googleapis.com)
    if (url.origin !== self.location.origin) return;
    // Ignore backend API endpoints and Vite dev server paths
    if (url.pathname.startsWith('/api/') || 
        url.pathname.includes('/@') || 
        url.pathname.includes('/node_modules/') ||
        url.pathname.includes('?v=')) {
      return;
    }

    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match(e.request);
      })
    );
  } catch {
    // If URL parsing fails, let browser handle normally
    return;
  }
});

