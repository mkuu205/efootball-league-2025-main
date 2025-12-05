// ==================== Firebase Cloud Messaging Notifications Manager ====================

// Firebase configuration (FULLY UPDATED)
const firebaseConfig = {
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.firebasestorage.app",
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579",
  measurementId: "G-MW8F3RD48D"
};

// Your VAPID Key
const VAPID_KEY = "BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c";

// Your Supabase Edge Function URL
const SAVE_TOKEN_URL = "https://zliedzrqzvywlsyfggcq.supabase.co/functions/v1/save-fcm-token";

let messaging = null;
let fcmToken = null;

// ==================== Firebase Initialization ====================
async function initializeFirebase() {
  try {
    if (typeof firebase === "undefined") {
      console.error("❌ Firebase SDK not loaded.");
      return false;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized");
    }

    messaging = firebase.messaging();
    console.log("✅ Firebase Messaging initialized");

    return true;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    return false;
  }
}

// ==================== Request Permission + Get Token ====================
async function requestNotificationPermission() {
  try {
    console.log("📱 Requesting notification permission...");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("⚠️ Notification permission denied");
      return null;
    }

    console.log("✅ Permission granted");

    // Register Service Worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("✅ Service Worker registered");

    // Get Token
    fcmToken = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (fcmToken) {
      console.log("✅ FCM Token:", fcmToken);
      await saveTokenToBackend(fcmToken);
      return fcmToken;
    } else {
      console.warn("⚠️ No FCM token available");
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating FCM token:", error);
    return null;
  }
}

// ==================== Save Token to Supabase ====================
async function saveTokenToBackend(token) {
  try {
    const session = localStorage.getItem("player_session") || sessionStorage.getItem("player_session");
    let playerId = null;

    if (session) {
      const data = JSON.parse(session);
      playerId = data.account_id || data.id;
    }

    const response = await fetch(SAVE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        player_id: playerId,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ Token saved to Supabase");
    } else {
      console.warn("⚠️ Could not save token:", data.message);
    }
  } catch (error) {
    console.error("❌ Error saving token:", error);
  }
}

// ==================== Foreground Notifications ====================
function setupForegroundMessageHandler() {
  if (!messaging) return;

  messaging.onMessage((payload) => {
    console.log("📩 Foreground message:", payload);

    const notificationTitle = payload.notification?.title || "eFootball League";
    const notificationOptions = {
      body: payload.notification?.body || "You have a new update!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: payload.data || {},
      tag: "efl-notification"
    };

    new Notification(notificationTitle, notificationOptions);
  });
}

// ==================== Modern Token Refresh (Firebase v10+) ====================
async function checkForTokenChange() {
  try {
    const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });

    if (newToken && newToken !== fcmToken) {
      console.log("🔄 Token changed:", newToken);
      fcmToken = newToken;
      await saveTokenToBackend(newToken);
    }
  } catch (error) {
    console.error("❌ Error checking token refresh:", error);
  }
}

// ==================== Initialization Flow ====================
async function initializeNotifications() {
  try {
    if (!("Notification" in window)) {
      console.warn("⚠️ Browser does not support notifications");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("⚠️ Service workers not supported");
      return;
    }

    const loaded = await initializeFirebase();
    if (!loaded) return;

    await requestNotificationPermission();
    setupForegroundMessageHandler();

    // Auto-check for token refresh every 5 minutes
    setInterval(checkForTokenChange, 5 * 60 * 1000);

    console.log("✅ Notifications fully initialized");
  } catch (error) {
    console.error("❌ Notification initialization failed:", error);
  }
}

// ==================== Public API ====================
window.notificationManager = {
  initialize: initializeNotifications,
  requestPermission: requestNotificationPermission,
  getToken: () => fcmToken
};

// Auto-run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeNotifications);
} else {
  initializeNotifications();
}
