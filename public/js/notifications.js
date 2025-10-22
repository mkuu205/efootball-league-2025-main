// notifications-fixed.js
class PushNotificationManager {
  constructor() {
    this.registration = null;
  }

  async init() {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported by this browser.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied.");
      return;
    }

    try {
      // ✅ Corrected service worker registration path
      this.registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("✅ Service Worker ready for notifications.");
    } catch (err) {
      console.error("Service Worker registration failed:", err);
      this.registration = null;
    }
  }

  // ------------------------------------------------------------------
  // Send Match Reminder Notification
  // ------------------------------------------------------------------
  async sendMatchReminder(match) {
    const title = `⚽ ${match.teamA} vs ${match.teamB}`;
    const body = `Your match starts at ${match.time}`;

    const options = {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: "/index.html?tab=fixtures" },
      actions: [
        { action: "view-fixtures", title: "View Fixtures" },
        { action: "snooze", title: "Snooze" }
      ]
    };

    try {
      if (this.registration && this.registration.showNotification) {
        await this.registration.showNotification(title, options);
        console.log("✅ Persistent notification shown via Service Worker.");
      } else {
        // Fallback for browsers without SW support (no actions allowed)
        const safeOptions = { ...options };
        delete safeOptions.actions;
        new Notification(title, safeOptions);
        console.log("⚠️ Fallback notification shown.");
      }
    } catch (err) {
      console.error("❌ Failed to show notification:", err);
    }
  }

  // ------------------------------------------------------------------
  // Send Generic Update Notification
  // ------------------------------------------------------------------
  async sendUpdateNotification(message) {
    const title = "🔔 Update Available";
    const options = {
      body: message || "A new version of the app is available.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: "/" }
    };

    try {
      if (this.registration && this.registration.showNotification) {
        await this.registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (err) {
      console.error("❌ Failed to send update notification:", err);
    }
  }
}

// Initialize automatically
document.addEventListener("DOMContentLoaded", async () => {
  const pushManager = new PushNotificationManager();
  await pushManager.init();
  window.PushNotificationManager = pushManager;
});
