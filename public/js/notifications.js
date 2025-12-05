// ==================== Firebase Cloud Messaging ====================

const firebaseConfig = {
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",  // ✅ FIXED
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579",
  measurementId: "G-MW8F3RD48D"
};

const VAPID_KEY = "BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c";

// Your Supabase REST endpoint
const SAVE_URL = "https://zliedzrqzvywlsyfggcq.supabase.co/rest/v1/fcm_tokens";

// Public anon key
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI";

let messaging = null;
let fcmToken = null;

// ==================== Init Firebase ====================
async function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    messaging = firebase.messaging();

    // ==================== Foreground Message Handler (moved here) ====================
    messaging.onMessage((payload) => {
      console.log("FCM Foreground:", payload);

      const title = payload.notification?.title || "eFootball League";
      const body = payload.notification?.body || "New update!";

      // Trigger UI toast
      if (typeof showToastNotification === "function") {
        showToastNotification(title, body);
      }

      // Update unread badge if function exists
      if (typeof updateUnreadBadge === "function") {
        updateUnreadBadge();
      }
    });

  } catch (e) {
    console.error("Firebase init failed:", e);
  }
}

// ==================== Request Permission ====================
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  fcmToken = await messaging.getToken({
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: reg
  });

  if (fcmToken) {
    await saveTokenToSupabase(fcmToken);
  }
}

// ==================== UPSERT Token to Supabase ====================
async function saveTokenToSupabase(token) {
  try {
    const session = JSON.parse(localStorage.getItem("player_session") || "{}");
    const playerId = session.account_id || null;

    const response = await fetch(SAVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        token,
        player_id: playerId,
        device_info: { ua: navigator.userAgent }
      })
    });

    if (!response.ok) {
      console.error("Supabase upsert error:", await response.json());
    }
  } catch (error) {
    console.error("Error saving token:", error);
  }
}

// ==================== Init ====================
async function initNotifications() {
  if (!("Notification" in window)) return;
  if (!("serviceWorker" in navigator)) return;

  await initFirebase();
  await requestNotificationPermission();
}

document.addEventListener("DOMContentLoaded", initNotifications);
