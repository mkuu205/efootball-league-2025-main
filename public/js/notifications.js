// public/js/notifications.js

const publicVapidKey =
  "BEOg5DAEgXVUZfVsnaDe72yBrCAJp4mEPs150PwJpaHUbc8kgSOp0Wz9pgzJd8GMuzQfoxbECKCjZ7HGnpsrwhs"; // your public key

// ✅ Register Service Worker & Subscribe
async function registerPush() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported in this browser.");
    return;
  }

  try {
    console.log("Registering service worker...");
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.log("Service Worker registered ✅");

    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied ❌");
      return;
    }

    console.log("Subscribing to push notifications...");
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    console.log("Sending subscription to server...");
    await fetch("/api/save-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    console.log("✅ Push subscription saved on server");
  } catch (err) {
    console.error("Push registration failed ❌", err);
  }
}

// ✅ Utility: convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// ✅ Auto-register on load
window.addEventListener("load", registerPush);
