// service-worker.js - Fixed Version
const CACHE_NAME = 'efl-tournament-v1.3';
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/css/style.css',
    '/js/database.js',
    '/js/api.js',
    '/js/auth.js',
    '/js/app.js',
    '/js/admin.js',
    '/js/advanced-stats.js',
    '/js/bulk-operations.js',
    '/js/notifications.js',
    '/js/export.js',
    '/js/pwa.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// URLs to never cache (icons, manifest)
const neverCacheUrls = [
    '/manifest.json',
    '/icons/',
    '/fixed-icons/'
];

self.addEventListener('install', (event) => {
    console.log('📦 Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📁 Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    
    // Never cache icons and manifest
    if (neverCacheUrls.some(path => url.pathname.includes(path))) {
        console.log('🚫 Skipping cache for:', url.pathname);
        event.respondWith(fetch(event.request));
        return;
    }
    
    // For API calls, use network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For all other requests, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
