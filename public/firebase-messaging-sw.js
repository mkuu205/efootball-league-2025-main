// ==================== FIREBASE IMPORTS ====================
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// ==================== FIREBASE CONFIG ====================
firebase.initializeApp({
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579"
});

// ==================== INIT MESSAGING ====================
const messaging = firebase.messaging();

// ==================== BACKGROUND MESSAGE HANDLER ====================
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received:", payload);

  const title = payload.notification?.title || "eFootball League";
  const options = {
    body: payload.notification?.body || "You have a new notification!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: payload.data?.url || "/"
    }
  };

  self.registration.showNotification(title, options);
});

// ==================== NOTIFICATION CLICK HANDLER ====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a tab is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ==================== OPTIONAL: HANDLE PUSH (NON-FCM FALLBACK) ====================
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Notification", body: event.data.text() };
  }

  const title = data.title || "eFootball League";
  const options = {
    body: data.body || "New update!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
