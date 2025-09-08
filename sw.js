const CACHE_NAME = 'chai-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/schema.meta',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/Auth.tsx',
  '/src/db.ts',
  '/src/PersonaQuiz.tsx',
  '/src/NetWorthCalculator.tsx',
  '/src/MonthlyFinances.tsx',
  '/src/InvestmentAllocation.tsx',
  '/src/FinancialHealthCard.tsx',
  '/src/FinancialProtectionCard.tsx',
  '/src/FinancialGoalsCard.tsx',
  '/src/RetirementTracker.tsx',
  '/src/ActionDetailModal.tsx',
  '/src/PowerOfSavingCard.tsx',
  '/src/MyPlan.tsx',
  '/src/icons.tsx',
  '/src/supabaseClient.ts',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install: Caches the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Fetch: Implements stale-while-revalidate
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
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
        });

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