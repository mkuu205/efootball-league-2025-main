# Firebase Cloud Messaging Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

## Step 2: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Under **Web Push certificates**, click **Generate key pair**
4. Copy the **VAPID key** (you'll need this)

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings**
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "eFootball League")
5. Copy the `firebaseConfig` object

## Step 4: Download Service Account Key

1. In Firebase Console, go to **Project Settings**
2. Navigate to **Service accounts** tab
3. Click **Generate new private key**
4. Save the JSON file as `firebase-service-account.json` in your project root
5. **IMPORTANT**: Add this file to `.gitignore` to keep it secure!

## Step 5: Update Configuration Files

### 5.1 Update `public/js/notifications.js`

Replace the `firebaseConfig` object (lines 4-10) with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace `YOUR_VAPID_KEY` (line 48) with your VAPID key from Step 2.

### 5.2 Update `public/firebase-messaging-sw.js`

Replace the `firebaseConfig` object (lines 6-12) with the same config.

## Step 6: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create FCM tokens table
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  player_id INTEGER REFERENCES player_accounts(id) ON DELETE CASCADE,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_fcm_tokens_player_id ON fcm_tokens(player_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
```

## Step 7: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

## Step 8: Update server.js

Add this line to load the FCM notifications module:

```javascript
require('./api/fcm-notifications')(app);
```

## Step 9: Add Firebase Scripts to HTML

Add these scripts to your HTML files (index.html, player-dashboard.html, etc.) before the closing `</body>` tag:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"></script>

<!-- Your notifications script -->
<script src="/js/notifications.js"></script>
```

## Step 10: Test Notifications

### Test from Browser Console:

```javascript
// Request permission
await notificationManager.requestPermission();

// Get token
console.log('FCM Token:', notificationManager.getToken());
```

### Test from Backend:

```bash
# Send to specific player
curl -X POST http://localhost:3000/api/send-notification-to-player \
  -H "Content-Type: application/json" \
  -d '{
    "player_id": 1,
    "title": "Test Notification",
    "body": "This is a test message!"
  }'

# Send to all users
curl -X POST http://localhost:3000/api/send-notification-to-all \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Announcement",
    "body": "New tournament starting soon!"
  }'
```

## API Endpoints

### Save FCM Token
- **POST** `/api/save-fcm-token`
- Body: `{ token, player_id, device_info }`

### Send to Specific Player
- **POST** `/api/send-notification-to-player`
- Body: `{ player_id, title, body, data }`

### Send to All Users
- **POST** `/api/send-notification-to-all`
- Body: `{ title, body, data }`

### Notify About Fixture
- **POST** `/api/notify-fixture`
- Body: `{ fixture_id, home_player_id, away_player_id, date, time }`

## Troubleshooting

### "Firebase not initialized"
- Make sure Firebase scripts are loaded before notifications.js
- Check browser console for errors

### "No FCM tokens found"
- Users need to grant notification permission first
- Check if tokens are being saved in the database

### "Permission denied"
- User needs to allow notifications in browser settings
- On mobile, check app/site settings

### Service Worker Issues
- Clear browser cache and re-register service worker
- Check that firebase-messaging-sw.js is accessible at root

## Security Notes

1. **Never commit** `firebase-service-account.json` to version control
2. Add to `.gitignore`:
   ```
   firebase-service-account.json
   .env
   ```
3. Keep your VAPID key and API keys secure
4. Use environment variables for sensitive data

## Example Usage in Your App

### Notify players about new match:
```javascript
// When admin creates a fixture
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

## Done! 🎉

Your Firebase Cloud Messaging is now set up and ready to send push notifications to your users!
