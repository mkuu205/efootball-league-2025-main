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

  // ✅ Foreground messages - show both browser notification AND in-app toast
  messaging.onMessage(payload => {
    const title = payload.notification?.title || "eFootball League";
    const body = payload.notification?.body || "New update";
    const url = payload.data?.url || null;

    // Show browser notification
    if (Notification.permission === "granted") {
      new Notification(title, { 
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png'
      });
    }

    // Show in-app toast notification
    showInAppNotification(title, body, url);
  });
}

// Show in-app notification toast
function showInAppNotification(title, body, url = null) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'custom-notification alert alert-info alert-dismissible fade show position-fixed';
  notification.style.cssText = `
    top: 80px; 
    right: 20px; 
    z-index: 1060; 
    min-width: 300px; 
    max-width: 400px;
    background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    cursor: pointer;
  `;
  
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-bell me-2" style="font-size: 1.2rem;"></i>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 2px;">${title}</div>
        <div style="font-size: 0.9rem;">${body}</div>
      </div>
    </div>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
  `;
  
  // Make it clickable
  if (url) {
    notification.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-close')) {
        window.location.href = url;
      }
    });
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 8 seconds
  setTimeout(() => { 
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 8000);
}

// ✅ REGISTER SERVICE WORKER + GET TOKEN (SILENT)
async function initNotifications() {
  if (!("serviceWorker" in navigator)) return;
  if (!("Notification" in window)) return;

  await initFirebase();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.log('No FCM token available');
      return;
    }

    // ✅ SEND TOKEN TO SERVER
    const sessionData = localStorage.getItem('player_session') || sessionStorage.getItem('player_session');
    let playerId = null;
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        playerId = session.account_id || session.id;
      } catch (e) {
        console.error('Error parsing session:', e);
      }
    }

    await fetch("/api/save-fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        player_id: playerId,
        device_info: { ua: navigator.userAgent }
      })
    });
    
    console.log('✅ Notifications initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
  }
}

document.addEventListener("DOMContentLoaded", initNotifications);
