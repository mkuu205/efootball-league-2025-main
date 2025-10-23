// notifications-fixed.js
class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.isSecureOrigin = window.location.protocol === 'https:';
    this.isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  }

  async init() {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported by this browser.");
      return;
    }

    // Check if we're on a secure origin (HTTPS required for notifications)
    if (!this.isSecureOrigin && !this.isLocalhost) {
      console.warn("🔒 Notifications require HTTPS. Current origin is insecure.");
      this.showInsecureOriginWarning();
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied.");
        return;
      }

      // Register service worker for persistent notifications
      if ('serviceWorker' in navigator) {
        try {
          this.registration = await navigator.serviceWorker.register("/service-worker.js");
          console.log("✅ Service Worker ready for notifications.");
        } catch (err) {
          console.error("Service Worker registration failed:", err);
          this.registration = null;
        }
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }

  showInsecureOriginWarning() {
    const warningMessage = `
      🔒 Push notifications are only available on secure (HTTPS) connections.
      To enable notifications, please access this site via HTTPS.
      Current features will work normally with in-app notifications.
    `;
    console.warn(warningMessage);
    
    // Show a non-intrusive UI message
    this.showBrowserNotification(
      "Notifications Limited", 
      "Push notifications require HTTPS. Using in-app notifications instead.",
      "warning"
    );
  }

  // ------------------------------------------------------------------
  // Send Match Reminder Notification (with fallback)
  // ------------------------------------------------------------------
  async sendMatchReminder(match) {
    const title = `⚽ ${match.teamA} vs ${match.teamB}`;
    const body = `Your match starts at ${match.time}`;

    // Try push notification first if available
    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(title, body, match);
    } else {
      // Fallback to browser notification
      this.showBrowserNotification(title, body, 'info');
    }
  }

  // ------------------------------------------------------------------
  // Send Generic Update Notification (with fallback)
  // ------------------------------------------------------------------
  async sendUpdateNotification(message) {
    const title = "🔔 Tournament Update";
    const body = message || "A new update is available for your tournament.";

    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(title, body);
    } else {
      this.showBrowserNotification(title, body, 'info');
    }
  }

  // ------------------------------------------------------------------
  // Send Result Notification
  // ------------------------------------------------------------------
  async sendResultNotification(homePlayer, awayPlayer, homeScore, awayScore) {
    const title = "🏆 Match Result";
    const body = `${homePlayer} ${homeScore}-${awayScore} ${awayPlayer}`;

    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(title, body);
    } else {
      this.showBrowserNotification(title, body, 'success');
    }
  }

  // ------------------------------------------------------------------
  // Send Fixture Update Notification
  // ------------------------------------------------------------------
  async sendFixtureUpdateNotification(fixture, updateType) {
    const title = "📅 Fixture Updated";
    const body = `${fixture.homePlayer} vs ${fixture.awayPlayer} - ${updateType}`;

    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(title, body);
    } else {
      this.showBrowserNotification(title, body, 'warning');
    }
  }

  // ------------------------------------------------------------------
  // Core Push Notification Method
  // ------------------------------------------------------------------
  async sendPushNotification(title, body, matchData = null) {
    const options = {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { 
        url: "/index.html?tab=fixtures",
        matchData: matchData
      },
      actions: [
        { action: "view-fixtures", title: "View Fixtures" },
        { action: "snooze", title: "Snooze" }
      ],
      tag: 'match-reminder', // Group similar notifications
      requireInteraction: true // Keep visible until dismissed
    };

    try {
      if (this.registration && this.registration.showNotification) {
        await this.registration.showNotification(title, options);
        console.log("✅ Persistent notification shown via Service Worker.");
      } else {
        // Fallback for browsers without SW support (no actions allowed)
        const safeOptions = { ...options };
        delete safeOptions.actions;
        const notification = new Notification(title, safeOptions);
        
        // Add click handler for fallback notifications
        notification.onclick = () => {
          window.focus();
          if (options.data && options.data.url) {
            window.location.href = options.data.url;
          }
        };
        
        console.log("⚠️ Fallback notification shown.");
      }
    } catch (err) {
      console.error("❌ Failed to show push notification:", err);
      // Fallback to browser notification
      this.showBrowserNotification(title, body, 'info');
    }
  }

  // ------------------------------------------------------------------
  // Fallback: Show in-app browser notification (non-push)
  // ------------------------------------------------------------------
  showBrowserNotification(title, message, type = 'info') {
    // Create a custom in-app notification
    const notification = document.createElement('div');
    notification.className = `custom-notification custom-notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const icon = this.getNotificationIcon(type);
    
    notification.innerHTML = `
      <div class="custom-notification-content">
        <div class="custom-notification-icon">${icon}</div>
        <div class="custom-notification-text">
          <div class="custom-notification-title">${title}</div>
          <div class="custom-notification-message">${message}</div>
        </div>
        <button class="custom-notification-close" aria-label="Close notification">&times;</button>
      </div>
    `;

    // Add to page
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach((existing, index) => {
      existing.style.top = `${20 + (index * 100)}px`;
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    const removeTimeout = setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    // Close button handler
    const closeButton = notification.querySelector('.custom-notification-close');
    closeButton.addEventListener('click', () => {
      clearTimeout(removeTimeout);
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    });

    // Click notification to focus app
    notification.addEventListener('click', (e) => {
      if (e.target !== closeButton) {
        window.focus();
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }
    });

    console.log("📢 In-app notification shown:", title);
  }

  getNotificationIcon(type) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || '📢';
  }

  // ------------------------------------------------------------------
  // Utility Methods
  // ------------------------------------------------------------------
  canUsePushNotifications() {
    return (this.isSecureOrigin || this.isLocalhost) && 
           "Notification" in window && 
           Notification.permission === "granted" &&
           this.registration !== null;
  }

  getStatus() {
    return {
      supported: "Notification" in window,
      secureOrigin: this.isSecureOrigin,
      localhost: this.isLocalhost,
      serviceWorker: !!this.registration,
      permission: Notification.permission,
      canUsePush: this.canUsePushNotifications()
    };
  }

  // ------------------------------------------------------------------
  // Permission Management
  // ------------------------------------------------------------------
  async requestPermission() {
    if (!("Notification" in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return 'denied';
    }
  }

  // ------------------------------------------------------------------
  // Test Method for Development
  // ------------------------------------------------------------------
  async testNotification(type = 'info') {
    const testData = {
      title: "Test Notification",
      message: "This is a test notification to verify the system is working.",
      type: type
    };

    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(testData.title, testData.message);
    } else {
      this.showBrowserNotification(testData.title, testData.message, testData.type);
    }

    return {
      method: this.canUsePushNotifications() ? 'push' : 'browser',
      status: this.getStatus()
    };
  }

  // ------------------------------------------------------------------
  // Cleanup Method
  // ------------------------------------------------------------------
  destroy() {
    // Clean up any ongoing operations
    this.registration = null;
    console.log("Notification manager destroyed");
  }
}

// Enhanced initialization with better error handling
document.addEventListener("DOMContentLoaded", async () => {
  // Check if we're in a supported environment
  if (typeof window === 'undefined') {
    console.warn('Notifications only work in browser environments');
    return;
  }

  try {
    const pushManager = new PushNotificationManager();
    
    // Initialize notifications
    await pushManager.init();
    
    // Make available globally
    window.PushNotificationManager = pushManager;
    
    // Log status for debugging
    console.log('🔔 Notification Manager Status:', pushManager.getStatus());
    
    // Auto-test on development
    if (pushManager.isLocalhost && window.location.search.includes('test-notifications')) {
      setTimeout(() => {
        pushManager.testNotification('info');
      }, 2000);
    }
    
  } catch (error) {
    console.error('Failed to initialize notification manager:', error);
    
    // Provide fallback even if initialization fails
    window.PushNotificationManager = {
      showBrowserNotification: (title, message, type) => {
        // Simple fallback that doesn't depend on class initialization
        const fallbackNotification = document.createElement('div');
        fallbackNotification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #1a1a2e;
          color: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #6c63ff;
          z-index: 10000;
          max-width: 300px;
        `;
        fallbackNotification.innerHTML = `
          <strong>${title}</strong><br>
          <span>${message}</span>
          <button onclick="this.parentElement.remove()" style="float:right;background:none;border:none;color:white;cursor:pointer">×</button>
        `;
        document.body.appendChild(fallbackNotification);
        setTimeout(() => {
          if (fallbackNotification.parentElement) {
            fallbackNotification.remove();
          }
        }, 5000);
      },
      getStatus: () => ({ supported: false, error: 'Initialization failed' })
    };
  }
});

// Service Worker for Push Notifications (create this file as service-worker.js)
const serviceWorkerCode = `
// service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
`;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PushNotificationManager;
}

// Global helper function for easy notification access
window.showAppNotification = function(title, message, type = 'info') {
  if (window.PushNotificationManager) {
    window.PushNotificationManager.showBrowserNotification(title, message, type);
  } else {
    console.warn('Notification manager not available');
    // Ultra simple fallback
    alert(`${title}: ${message}`);
  }
};
