// ======================= SIMPLE UON-STYLE NOTIFICATIONS =======================

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDX99S2FDS3yd8NBEREBKK-P77G4OOWfoM",
    authDomain: "efootball-league-4f456.firebaseapp.com",
    projectId: "efootball-league-4f456",
    storageBucket: "efootball-league-4f456.firebasestorage.app",
    messagingSenderId: "688740313852",
    appId: "1:688740313852:web:9bbf8fe7e4318a11874579"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Supabase URL for saving token
const SAVE_URL = "https://zliedzrqzvywlsyfggcq.supabase.co/rest/v1/fcm_tokens";

// This gets called when page loads
document.addEventListener("DOMContentLoaded", () => {
    requestNotificationPermission();
});

async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.warn("Notification permission denied");
        return;
    }

    console.log("Permission granted, getting token...");

    const vapidKey = "BNK1tuKFy0ZdpHqYQYnFtbekYo1e2_bzEcnADrbOon4io6Zu2fyLCkwu-k3RImX2c-3Y-VJecC-nsYhmR8y2K-c";

    try {
        const token = await messaging.getToken({ vapidKey });

        if (!token) {
            console.warn("No FCM token received");
            return;
        }

        console.log("FCM Token:", token);

        // Save token into Supabase
        await saveTokenToSupabase(token);

    } catch (error) {
        console.error("Error getting FCM token:", error);
    }
}

// Save token into Supabase table (simple REST API)
async function saveTokenToSupabase(token) {
    const session = localStorage.getItem("player_session") || sessionStorage.getItem("player_session");
    let playerId = null;

    if (session) {
        const data = JSON.parse(session);
        playerId = data.account_id || data.id;
    }

    const response = await fetch(SAVE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI",
            "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
            token,
            player_id: playerId,
            device_info: { userAgent: navigator.userAgent }
        })
    });

    if (response.ok) {
        console.log("Token saved successfully!");
    } else {
        console.error("Error saving token:", await response.text());
    }
}
