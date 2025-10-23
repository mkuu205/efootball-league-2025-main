// service-worker.js

const CACHE_NAME = 'tournament-manager-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html', 
  '/css/styles.css',
  '/js/app.js',
  '/js/database.js',
  '/js/auth.js',
  '/js/notifications.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip chrome-extension requests and other unsupported schemes
  if (event.request.url.startsWith('chrome-extension:') ||
      event.request.url.startsWith('moz-extension:') ||
      event.request.url.startsWith('ms-browser-extension:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(error => {
        console.log('Fetch failed; returning offline page:', error);
        // You could return a custom offline page here
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        // Check if the client's URL matches and focus it
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(urlToOpen).then(client => client.focus());
        }
      }
      // If no window/tab is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  // You can track notification engagement here
});

// Background sync for offline functionality (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // You can implement background data sync here
  }
});

// Push event for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: data.data,
    actions: data.actions || [],
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
