// ==================== Firebase Cloud Messaging ====================

const firebaseConfig = {
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579"
};

const VAPID_KEY =
  "BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c";

let messaging = null;

// ✅ INIT FIREBASE
function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  messaging = firebase.messaging();

  // ✅ Foreground messages (NO TOKEN LOGGING)
  messaging.onMessage(payload => {
    const title = payload.notification?.title || "eFootball League";
    const body = payload.notification?.body || "New update";

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  });
}

// ✅ REGISTER SERVICE WORKER + GET TOKEN (SILENT)
async function initNotifications() {
  if (!("serviceWorker" in navigator)) return;
  if (!("Notification" in window)) return;

  await initFirebase();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.register(
    "/public/firebase-messaging-sw.js",
    { scope: "/" }
  );

  const token = await messaging.getToken({
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration
  });

  if (!token) return;

  // ✅ SEND TOKEN TO SERVER (NO CONSOLE LOG)
  await fetch("/api/save-fcm-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      player_id: JSON.parse(localStorage.getItem("player_session") || "{}")
        ?.account_id || null,
      device_info: { ua: navigator.userAgent }
    })
  });
}

document.addEventListener("DOMContentLoaded", initNotifications);
