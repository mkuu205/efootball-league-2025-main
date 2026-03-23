importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579"
});

const messaging = firebase.messaging();

// ✅ BACKGROUND PUSH
messaging.onBackgroundMessage(payload => {
  console.log("📩 Background message:", payload);

  self.registration.showNotification(
    payload.notification?.title || "eFootball League",
    {
      body: payload.notification?.body || "New update!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: payload.data || {}
    }
  );
});

// ✅ CLICK HANDLER
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
