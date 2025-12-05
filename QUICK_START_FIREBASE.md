# Quick Start: Firebase Cloud Messaging

## What I've Done ✅

1. ✅ Created Firebase-based notification system
2. ✅ Updated `public/js/notifications.js` with Firebase FCM
3. ✅ Created `public/firebase-messaging-sw.js` service worker
4. ✅ Created `api/fcm-notifications.js` backend API
5. ✅ Updated `server.js` to load FCM module
6. ✅ Created comprehensive setup guide

## What You Need to Do 🔧

### 1. Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### 2. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Enable Cloud Messaging

### 3. Get Your Firebase Config
In Firebase Console → Project Settings → General:
- Copy the `firebaseConfig` object
- You'll need: apiKey, authDomain, projectId, etc.

### 4. Get VAPID Key
In Firebase Console → Project Settings → Cloud Messaging:
- Under "Web Push certificates"
- Click "Generate key pair"
- Copy the key

### 5. Download Service Account Key
In Firebase Console → Project Settings → Service accounts:
- Click "Generate new private key"
- Save as `firebase-service-account.json` in project root
- **Add to .gitignore!**

### 6. Update Configuration Files

**File: `public/js/notifications.js`** (lines 4-10)
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**File: `public/js/notifications.js`** (line 48)
```javascript
vapidKey: 'YOUR_VAPID_KEY_HERE'
```

**File: `public/firebase-messaging-sw.js`** (lines 6-12)
- Use the same firebaseConfig

### 7. Create Database Table
Run in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  player_id INTEGER REFERENCES player_accounts(id) ON DELETE CASCADE,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fcm_tokens_player_id ON fcm_tokens(player_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
```

### 8. Add Firebase Scripts to HTML
Add to `index.html`, `player-dashboard.html`, etc. before `</body>`:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"></script>
<script src="/js/notifications.js"></script>
```

### 9. Update .gitignore
```
firebase-service-account.json
.env
node_modules/
```

### 10. Restart Server
```bash
npm start
```

## Testing 🧪

### Test in Browser Console:
```javascript
// Request permission
await notificationManager.requestPermission();

// Get token
console.log(notificationManager.getToken());
```

### Test from Backend:
```bash
# Send to specific player
curl -X POST http://localhost:3000/api/send-notification-to-player \
  -H "Content-Type: application/json" \
  -d '{"player_id": 1, "title": "Test", "body": "Hello!"}'

# Send to all
curl -X POST http://localhost:3000/api/send-notification-to-all \
  -H "Content-Type: application/json" \
  -d '{"title": "Announcement", "body": "New update!"}'
```

## API Endpoints 📡

- `POST /api/save-fcm-token` - Save user's FCM token
- `POST /api/send-notification-to-player` - Send to specific player
- `POST /api/send-notification-to-all` - Broadcast to all users
- `POST /api/notify-fixture` - Notify about new match

## Example Usage 💡

### Notify players when fixture is created:
```javascript
// In admin panel after creating fixture
await fetch('/api/notify-fixture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fixture_id: 123,
    home_player_id: 1,
    away_player_id: 2,
    date: '2025-01-15',
    time: '15:00'
  })
});
```

### Send tournament announcement:
```javascript
await fetch('/api/send-notification-to-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '🏆 Tournament Update',
    body: 'Round 2 fixtures are now available!',
    data: { url: '/fixtures' }
  })
});
```

## Troubleshooting 🔧

**"Firebase not initialized"**
- Check if Firebase scripts are loaded before notifications.js
- Verify firebaseConfig is correct

**"No FCM tokens found"**
- Users must grant notification permission first
- Check database for saved tokens

**Service Worker not registering**
- Clear browser cache
- Check firebase-messaging-sw.js is at root level
- Verify file is accessible at /firebase-messaging-sw.js

## Need Help? 📚

See `FIREBASE_SETUP_GUIDE.md` for detailed instructions!
