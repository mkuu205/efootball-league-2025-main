// ==================== Firebase Cloud Messaging Notifications Manager ====================

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxVZ8QZ9Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "110568943036951744666",
  appId: "1:110568943036951744666:web:YOUR_APP_ID"
};

let messaging = null;
let fcmToken = null;

// Initialize Firebase
async function initializeFirebase() {
  try {
    // Check if Firebase is already loaded
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK not loaded. Make sure to include Firebase scripts in your HTML.');
      return false;
    }

    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    }

    // Get Firebase Messaging instance
    messaging = firebase.messaging();
    console.log('✅ Firebase Messaging initialized');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
}

// Request notification permission and get FCM token
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

    // Get FCM token
    fcmToken = await messaging.getToken({
      vapidKey: 'BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c',
      serviceWorkerRegistration: registration
    });

    if (fcmToken) {
      console.log('✅ FCM Token obtained:', fcmToken);
      
      // Save token to backend
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
    // Get player session if available
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

// Handle foreground messages
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

    // Show notification even when app is in foreground
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }
  });
}

// Handle token refresh
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

// Initialize notifications
async function initializeNotifications() {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    // Initialize Firebase
    const firebaseInitialized = await initializeFirebase();
    if (!firebaseInitialized) {
      console.error('❌ Cannot initialize notifications without Firebase');
      return;
    }

    // Request permission and get token
    await requestNotificationPermission();

    // Setup message handlers
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

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
  initializeNotifications();
}
