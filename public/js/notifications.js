// notifications.js
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
      // Register service worker first
      if ('serviceWorker' in navigator) {
        try {
          this.registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          console.log('✅ Service Worker registered successfully:', this.registration);
          
          // Wait for service worker to be ready
          if (this.registration.installing) {
            console.log('Service Worker installing');
          } else if (this.registration.waiting) {
            console.log('Service Worker installed');
          } else if (this.registration.active) {
            console.log('Service Worker active');
          }
        } catch (err) {
          console.error('Service Worker registration failed:', err);
          this.registration = null;
          return;
        }
      }

      // Then request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied.");
        return;
      }

      console.log('🔔 Notification system fully initialized');
      
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
  // Send Player Registration Notification
  // ------------------------------------------------------------------
  async sendPlayerRegistrationNotification(playerName, teamName) {
    const title = "👤 New Player Registered";
    const body = `${playerName} has joined ${teamName}`;

    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(title, body);
    } else {
      this.showBrowserNotification(title, body, 'info');
    }
  }

  // ------------------------------------------------------------------
  // Send Tournament Started Notification
  // ------------------------------------------------------------------
  async sendTournamentStartedNotification(tournamentName) {
    const title = "🎯 Tournament Started";
    const body = `${tournamentName} has officially begun!`;

    if (this.canUsePushNotifications()) {
      await this.sendPushNotification(title, body);
    } else {
      this.showBrowserNotification(title, body, 'success');
    }
  }

  // ------------------------------------------------------------------
  // Core Push Notification Method
  // ------------------------------------------------------------------
  async sendPushNotification(title, body, matchData = null) {
    if (!this.canUsePushNotifications()) {
      console.warn('Push notifications not available, using fallback');
      this.showBrowserNotification(title, body, 'info');
      return;
    }

    const options = {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { 
        url: "/index.html?tab=fixtures",
        matchData: matchData,
        timestamp: new Date().toISOString()
      },
      actions: [
        { action: "view-fixtures", title: "View Fixtures" },
        { action: "snooze", title: "Snooze" }
      ],
      tag: 'match-reminder',
      requireInteraction: true
    };

    try {
      console.log('Sending push notification via service worker...');
      await this.registration.showNotification(title, options);
      console.log("✅ Push notification sent successfully");
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
  // Batch Notification Methods
  // ------------------------------------------------------------------
  async sendBatchMatchReminders(fixtures, players) {
    const results = [];
    
    for (const fixture of fixtures) {
      const homePlayer = players.find(p => p.id === fixture.home_player_id);
      const awayPlayer = players.find(p => p.id === fixture.away_player_id);
      
      if (homePlayer && awayPlayer) {
        const result = await this.sendMatchReminder({
          teamA: homePlayer.name,
          teamB: awayPlayer.name,
          time: fixture.time || '15:00',
          date: fixture.date
        });
        results.push(result);
      }
    }
    
    return results;
  }

  async sendBatchResults(results, players) {
    const notifications = [];
    
    for (const result of results) {
      const homePlayer = players.find(p => p.id === result.home_player_id);
      const awayPlayer = players.find(p => p.id === result.away_player_id);
      
      if (homePlayer && awayPlayer) {
        const notification = await this.sendResultNotification(
          homePlayer.name,
          awayPlayer.name,
          result.home_score,
          result.away_score
        );
        notifications.push(notification);
      }
    }
    
    return notifications;
  }

  // ------------------------------------------------------------------
  // Notification Analytics
  // ------------------------------------------------------------------
  getNotificationStats() {
    // This would track notification engagement in a real app
    return {
      sent: 0, // Would be tracked in a real implementation
      delivered: 0,
      clicked: 0,
      lastSent: null
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
        pushManager.testNotification('success');
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
      getStatus: () => ({ supported: false, error: 'Initialization failed' }),
      canUsePushNotifications: () => false,
      testNotification: (type) => {
        window.PushNotificationManager.showBrowserNotification(
          'Test Notification', 
          'This is a test notification', 
          type
        );
      }
    };
  }
});

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

// Integration with existing database functions
if (typeof window !== 'undefined' && window.getData && window.DB_KEYS) {
  // Auto-send notifications for new results
  const originalAddResult = window.addResult;
  if (originalAddResult) {
    window.addResult = async function(result) {
      const addedResult = await originalAddResult.call(this, result);
      
      // Send notification for new result
      if (window.PushNotificationManager && addedResult) {
        const players = await getData(DB_KEYS.PLAYERS);
        const homePlayer = players.find(p => p.id === result.home_player_id);
        const awayPlayer = players.find(p => p.id === result.away_player_id);
        
        if (homePlayer && awayPlayer) {
          window.PushNotificationManager.sendResultNotification(
            homePlayer.name,
            awayPlayer.name,
            result.home_score,
            result.away_score
          );
        }
      }
      
      return addedResult;
    };
  }

  // Auto-send notifications for new players
  const originalAddPlayer = window.addPlayer;
  if (originalAddPlayer) {
    window.addPlayer = async function(playerData) {
      const addedPlayer = await originalAddPlayer.call(this, playerData);
      
      // Send notification for new player
      if (window.PushNotificationManager && addedPlayer) {
        window.PushNotificationManager.sendPlayerRegistrationNotification(
          addedPlayer.name,
          addedPlayer.team
        );
      }
      
      return addedPlayer;
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PushNotificationManager;
}
