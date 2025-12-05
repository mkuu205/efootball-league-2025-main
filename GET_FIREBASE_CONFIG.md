# 🔥 How to Get Your Firebase Config (apiKey & appId)

## Step-by-Step Visual Guide

### Step 1: Go to Firebase Console
🔗 **URL**: https://console.firebase.google.com/

### Step 2: Select Your Project
- Click on your project: **efootball-league-4f456**

### Step 3: Go to Project Settings
1. Click the **⚙️ Gear icon** (top left, next to "Project Overview")
2. Select **"Project settings"**

### Step 4: Find Your Web App Config

#### Option A: If you already have a web app
1. Scroll down to **"Your apps"** section
2. Look for the **Web app** (icon: `</>`  )
3. Click on the app name or **"Config"** button
4. You'll see the `firebaseConfig` object

#### Option B: If you DON'T have a web app yet
1. Scroll down to **"Your apps"** section
2. Click **"Add app"** button
3. Select the **Web icon** (`</>`)
4. Give it a nickname: **"eFootball League Web"**
5. ✅ Check **"Also set up Firebase Hosting"** (optional)
6. Click **"Register app"**
7. Copy the `firebaseConfig` object shown

### Step 5: Copy Your Config

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123XYZ...",           // ← COPY THIS
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "110568943036951744666",
  appId: "1:110568943036951744666:web:abc123xyz"  // ← COPY THIS
};
```

### Step 6: Update Your Files

You need to update **2 files** with the `apiKey` and `appId`:

#### File 1: `public/js/notifications.js`

Find this section (around line 4-10):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxVZ8QZ9Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z",  // ← REPLACE THIS
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "110568943036951744666",
  appId: "1:110568943036951744666:web:YOUR_APP_ID"  // ← REPLACE THIS
};
```

Replace:
- `apiKey` with your actual API key
- `appId` with your actual App ID

#### File 2: `public/firebase-messaging-sw.js`

Find the same section (around line 6-12) and update the same values.

---

## 🎯 Quick Copy-Paste Template

Once you have your config, use this template:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_HERE",
  authDomain: "efootball-league-4f456.firebaseapp.com",
  projectId: "efootball-league-4f456",
  storageBucket: "efootball-league-4f456.appspot.com",
  messagingSenderId: "110568943036951744666",
  appId: "YOUR_ACTUAL_APP_ID_HERE"
};
```

---

## ✅ Verification Checklist

After updating:

- [ ] `apiKey` starts with "AIzaSy..."
- [ ] `appId` looks like "1:110568943036951744666:web:..."
- [ ] Both files updated (notifications.js AND firebase-messaging-sw.js)
- [ ] No placeholder text like "YOUR_APP_ID" remains
- [ ] Server restarted

---

## 🔍 Where Exactly in Firebase Console?

```
Firebase Console
  └── Select Project: efootball-league-4f456
      └── ⚙️ Project Settings (gear icon)
          └── General Tab
              └── Scroll down to "Your apps"
                  └── Web app (</> icon)
                      └── SDK setup and configuration
                          └── Config radio button
                              └── Copy firebaseConfig object
```

---

## 📸 What You're Looking For

In Firebase Console, you'll see a code snippet like this:

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbc123...",              // ← THIS
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"        // ← AND THIS
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
```

**You only need the `apiKey` and `appId` values!**

---

## 🚨 Common Mistakes

❌ **Don't do this:**
- Don't copy the entire code snippet
- Don't include the import statements
- Don't change projectId or messagingSenderId (they're already correct)

✅ **Do this:**
- Only replace `apiKey` value
- Only replace `appId` value
- Keep everything else the same

---

## 🆘 Still Can't Find It?

### Alternative Method:

1. Go to Firebase Console
2. Click your project
3. Click **⚙️ Settings** → **Project settings**
4. Click **"General"** tab
5. Scroll to **"Your apps"**
6. If no web app exists:
   - Click **"Add app"**
   - Choose **Web** (`</>`)
   - Register it
7. Click on your web app name
8. You'll see the config!

---

## 📞 Need Help?

If you're stuck:
1. Make sure you're logged into Firebase Console
2. Make sure you selected the correct project
3. Make sure you're looking at the "General" tab in Project Settings
4. If no web app exists, create one first

---

## ✨ After You Update

1. Save both files
2. Restart your server: `npm start`
3. Open browser console (F12)
4. Look for: "✅ Firebase initialized"
5. Test notifications from admin panel!

---

**That's it!** Once you have these two values, your Firebase notifications will work perfectly! 🎉
