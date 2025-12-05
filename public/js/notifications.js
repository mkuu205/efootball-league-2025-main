// ==================== Firebase Cloud Messaging Notifications Manager ====================

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.firebasestorage.app",
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579",
  measurementId: "G-MW8F3RD48D"
};

// VAPID KEY
const VAPID_KEY =
  "BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c";

// Your Supabase Edge Function URL
const SAVE_TOKEN_URL =
  "https://zliedzrqzvywlsyfggcq.supabase.co/functions/v1/save-fcm-token";

let messaging = null;
let fcmToken = null;

// ==================== INITIALIZE FIREBASE ====================
async function initializeFirebase() {
  try {
    if (typeof firebase === "undefined") {
      console.error("❌ Firebase SDK not loaded");
      return false;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    messaging = firebase.messaging();
    return true;
  } catch (err) {
    console.error("❌ Firebase init error:", err);
    return false;
  }
}

// ==================== REQUEST NOTIFICATION PERMISSION ====================
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    // Get FCM token
    fcmToken = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (fcmToken) {
      await saveTokenToBackend(fcmToken);
      return fcmToken;
    }

    return null;
  } catch (err) {
    console.error("❌ Error requesting permission:", err);
    return null;
  }
}

// ==================== SAVE TOKEN TO SUPABASE ====================
async function saveTokenToBackend(token) {
  try {
    // Detect player session
    const session =
      localStorage.getItem("player_session") ||
      sessionStorage.getItem("player_session");

    let playerId = null;
    if (session) {
      const s = JSON.parse(session);
      playerId = s.account_id || s.id || null;
    }

    const res = await fetch(SAVE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token, // IMPORTANT
        player_id: playerId,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      })
    });

    const data = await res.json();

    if (data.success) {
      console.log("✅ FCM token saved");
    } else {
      console.warn("⚠️ Save failed:", data.message);
    }
  } catch (err) {
    console.error("❌ Token save failed:", err);
  }
}

// ==================== FOREGROUND NOTIFICATIONS ====================
function setupForegroundMessageHandler() {
  if (!messaging) return;

  messaging.onMessage((payload) => {
    const notificationTitle =
      payload.notification?.title || "eFootball League";
    const notificationOptions = {
      body: payload.notification?.body || "You have a new update!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: payload.data || {}
    };

    new Notification(notificationTitle, notificationOptions);
  });
}

// ==================== TOKEN REFRESH CHECK ====================
async function checkForTokenChange() {
  try {
    const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });
    if (newToken && newToken !== fcmToken) {
      fcmToken = newToken;
      await saveTokenToBackend(newToken);
    }
  } catch (err) {
    console.error("❌ Token refresh error:", err);
  }
}

// ==================== INITIALIZER ====================
async function initializeNotifications() {
  try {
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    const ok = await initializeFirebase();
    if (!ok) return;

    await requestNotificationPermission();

    setupForegroundMessageHandler();

    // Auto-check token refresh every 5 minutes
    setInterval(checkForTokenChange, 5 * 60 * 1000);

    console.log("✅ Notifications initialized");
  } catch (err) {
    console.error("❌ Notification system failed:", err);
  }
}

// Public API
window.notificationManager = {
  initialize: initializeNotifications,
  requestPermission: requestNotificationPermission,
  getToken: () => fcmToken
};

// Auto-run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeNotifications);
} else {
  initializeNotifications();
}
