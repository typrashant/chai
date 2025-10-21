const CACHE_NAME = 'chai-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install: Caches the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use no-cache to ensure we get the latest versions from the server on install
        const cachePromises = URLS_TO_CACHE.map(url => {
            const request = new Request(url, { cache: 'no-cache' });
            return fetch(request).then(response => {
                if (response.ok) {
                    return cache.put(request, response);
                }
                return Promise.reject(`Failed to fetch ${url}: ${response.statusText}`);
            });
        });
        return Promise.all(cachePromises);
      })
  );
});

// Fetch: Implements stale-while-revalidate
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.error('Fetch failed:', err);
            // This could be a place to return a custom offline page if needed
        });

        // Return cached response immediately if available, and fetch in background
        return response || fetchPromise;
      });
    })
  );
});

// Activate: Cleans up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});