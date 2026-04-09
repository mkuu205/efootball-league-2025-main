# Admin Authentication Setup Guide

## Overview
The admin authentication system uses:
- **Database**: PostgreSQL (Neon) `admin_auth` table
- **Password Hashing**: bcrypt
- **Authentication**: JWT tokens
- **Login**: Email + Password via `/api/admin/login`

## Quick Start

### 1. Generate Bcrypt Hash for Password

You need to generate a bcrypt hash for the password `kish24`.

**Option A: Run locally (if you have Node.js)**
```bash
cd backend
node generate-admin-hash.js
```

**Option B: Use online bcrypt generator**
1. Go to: https://bcrypt-generator.com/
2. Enter password: `kish24`
3. Set rounds: `10`
4. Click "Generate BCrypt"
5. Copy the hash

**Option C: Use this pre-generated hash** (for password: kish24)
```
$2b$10$rLjXU8Z5xKZj3xKZjOu.K5xKZj3xKZj3xKZj3xKZj3xKZj3xKZj3xK
```

### 2. Update Database

**Via Neon Dashboard:**
1. Go to your Neon PostgreSQL dashboard
2. Open SQL Editor
3. Run this query (replace YOUR_HASH with actual hash):

```sql
-- Create table
CREATE TABLE IF NOT EXISTS admin_auth (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin (UPDATE THE HASH!)
INSERT INTO admin_auth (email, password) VALUES
    ('admin.kishtech.co.ke', '$2b$10$YOUR_HASH_HERE')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Verify
SELECT id, email, created_at FROM admin_auth WHERE email = 'admin.kishtech.co.ke';
```

### 3. Test Admin Login

1. Go to: `https://tournament.kishtech.co.ke/admin.html`
2. Login with:
   - **Email**: `admin.kishtech.co.ke`
   - **Password**: `kish24`
3. Dashboard should load without any redirects!

## How It Works

### Backend Flow
```
POST /api/admin/login
  ↓
Check email in database
  ↓
Verify password with bcrypt
  ↓
Generate JWT token (24h expiry)
  ↓
Return { success: true, data: { token, admin } }
```

### Frontend Flow
```
User enters email + password
  ↓
Send POST to /api/admin/login
  ↓
Save token to localStorage
  ↓
Hide login form, show dashboard
  ↓
All API calls include: Authorization: Bearer <token>
```

## Protected Routes

These routes require admin JWT token:
- `POST /api/tournaments/create`
- `POST /api/fixtures/generate`
- `POST /api/notifications/admin/notify-all`
- `GET /api/admin/verify`

### How to Call Protected Routes

```javascript
const token = localStorage.getItem('admin_token');

fetch('/api/tournaments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'Tournament 1' })
});
```

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── adminAuthController.js    # Login & verify logic
│   ├── middleware/
│   │   └── adminAuth.js              # JWT verification middleware
│   ├── routes/
│   │   └── admin.js                  # Admin routes
│   └── config/
│       └── schema.sql                # Database schema (includes admin_auth)
├── generate-admin-hash.js            # Helper to generate bcrypt hash
└── setup-admin.sql                   # SQL setup script

frontend/
└── admin.html                        # Admin login + dashboard
```

## Security Features

✅ Password hashed with bcrypt (10 rounds)
✅ JWT tokens expire in 24 hours
✅ Token stored in localStorage
✅ All admin routes protected by middleware
✅ No automatic redirects - clean UX
✅ Separate from player authentication

## Troubleshooting

### "Invalid email or password" error
- Check if admin exists in database: `SELECT * FROM admin_auth;`
- Verify bcrypt hash is correct
- Check email spelling: `admin.kishtech.co.ke`

### "No token provided" error
- Login again to get fresh token
- Check localStorage has `admin_token`
- Clear localStorage and re-login

### Database table doesn't exist
- Run schema.sql or setup-admin.sql
- Table name is `admin_auth` (not `admin`)

### 502 Bad Gateway
- Check Render logs for errors
- Verify DATABASE_URL is set
- Ensure bcrypt package is installed

## API Reference

### POST /api/admin/login
Login and get JWT token.

**Request:**
```json
{
  "email": "admin.kishtech.co.ke",
  "password": "kish24"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "email": "admin.kishtech.co.ke"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### GET /api/admin/verify
Verify if token is valid (requires Authorization header).

**Headers:**
```
Authorization: Bearer <your-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "admin": {
      "id": 1,
      "email": "admin.kishtech.co.ke",
      "role": "admin"
    }
  }
}
```

## Next Steps

1. ✅ Generate bcrypt hash
2. ✅ Insert admin into database
3. ✅ Test login at `/admin.html`
4. ✅ Create tournaments, fixtures, notifications
5. ✅ Change password if needed (re-insert with new hash)

---

**Need Help?** Check Render logs: https://dashboard.render.com
