// ==================== Firebase Cloud Messaging Notifications Manager ====================

// Firebase configuration (UPDATED WITH CORRECT VALUES)
const firebaseConfig = {
  apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.firebasestorage.app",
  messagingSenderId: "688740313852",
  appId: "1:688740313852:web:9bbf8fe7e4318a11874579",
  measurementId: "G-MW8F3RD48D"
};

let messaging = null;
let fcmToken = null;

// Initialize Firebase
async function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK not loaded. Include Firebase scripts.');
      return false;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    }

    messaging = firebase.messaging();
    console.log('✅ Firebase Messaging initialized');

    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
}

// Request permission + generate token
async function requestNotificationPermission() {
  try {
    console.log('📱 Requesting notification permission...');

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
      return null;
    }

    console.log('✅ Notification permission granted');

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered');

    // Get FCM token using your real VAPID key
    fcmToken = await messaging.getToken({
      vapidKey: "BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c",
      serviceWorkerRegistration: registration
    });

    if (fcmToken) {
      console.log('✅ FCM Token obtained:', fcmToken);

      await saveTokenToBackend(fcmToken);
      return fcmToken;
    } else {
      console.warn('⚠️ No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
}

// Save FCM token to backend
async function saveTokenToBackend(token) {
  try {
    const session = localStorage.getItem('player_session') || sessionStorage.getItem('player_session');
    let playerId = null;

    if (session) {
      const sessionData = JSON.parse(session);
      playerId = sessionData.account_id || sessionData.id;
    }

    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      console.log('✅ FCM token saved to backend');
    } else {
      console.warn('⚠️ Failed to save FCM token:', data.message);
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
  }
}

// Foreground notifications
function setupForegroundMessageHandler() {
  if (!messaging) return;

  messaging.onMessage((payload) => {
    console.log('📩 Foreground message received:', payload);

    const notificationTitle = payload.notification?.title || 'eFootball League 2025';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new update!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: payload.data || {},
      tag: 'efl-notification'
    };

    new Notification(notificationTitle, notificationOptions);
  });
}

// Token refresh handler
function setupTokenRefreshHandler() {
  if (!messaging) return;

  messaging.onTokenRefresh(async () => {
    try {
      const refreshedToken = await messaging.getToken();
      console.log('🔄 Token refreshed:', refreshedToken);
      await saveTokenToBackend(refreshedToken);
    } catch (error) {
      console.error('❌ Unable to refresh token:', error);
    }
  });
}

// Initialize everything
async function initializeNotifications() {
  try {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    const firebaseInitialized = await initializeFirebase();

    if (!firebaseInitialized) {
      console.error('❌ Cannot initialize notifications without Firebase');
      return;
    }

    await requestNotificationPermission();

    setupForegroundMessageHandler();
    setupTokenRefreshHandler();

    console.log('✅ Notifications fully initialized');
  } catch (error) {
    console.error('❌ Notification initialization failed:', error);
  }
}

// Public API
window.notificationManager = {
  initialize: initializeNotifications,
  requestPermission: requestNotificationPermission,
  getToken: () => fcmToken
};

// Auto-start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
  initializeNotifications();
}
