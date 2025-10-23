// ============================================================
// service-worker.js — eFootball League 2025

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

// Files to skip caching (dynamic content)
const neverCacheUrls = ['/manifest.json', '/icons/'];

// ------------------------------------------------------------
// INSTALL EVENT
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// ACTIVATE EVENT
// ------------------------------------------------------------
self.addEventListener('activate', (event) => {
  console.log('🔄 Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
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

// ------------------------------------------------------------
// FETCH EVENT (Network & Cache Handling)
// ------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip manifest and icons
  if (neverCacheUrls.some(path => url.pathname.includes(path))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static files
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
  );
});

// ============================================================
// ✅ FIXED: Persistent Notification & Action Support
// ============================================================

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  event.notification.close();

  // Handle action buttons
  if (event.action === 'view-fixtures') {
    event.waitUntil(clients.openWindow('/index.html?tab=fixtures'));
  } else if (event.action === 'snooze') {
    // Send a message to the client
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientsArr) => {
          for (const client of clientsArr) {
            client.postMessage({
              action: 'snoozeReminder',
              data: event.notification.data || {}
            });
          }
        })
    );
  } else {
    // Default click (open the URL if provided)
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

