// public/service-worker.js

self.addEventListener("push", (event) => {
  console.log("📩 Push received:", event);

  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    console.error("Failed to parse push data:", err);
  }

  const title = data.title || "eFootball League 2025";
  const options = {
    body: data.body || "You have a new notification!",
    icon: "/icons/icon-192x192.png", // adjust this to your icon path
    badge: "/icons/icon-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
