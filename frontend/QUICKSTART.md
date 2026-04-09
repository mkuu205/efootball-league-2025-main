# 🚀 Quick Start Guide - eFootball League 2026

Get your eFootball League system running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and update:

```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your-secret-key-here
PAYFLOW_CONSUMER_KEY=your_key
PAYFLOW_CONSUMER_SECRET=your_secret
PAYFLOW_SHORTCODE=your_shortcode
PAYFLOW_PASSKEY=your_passkey
PAYFLOW_CALLBACK_URL=http://localhost:3000/api/payflow/webhook
```

## Step 3: Setup Database

### Option A: Automatic (Recommended)
Database initializes automatically on first server start.

### Option B: Manual
```bash
psql "your_database_url" -f src/config/schema.sql
```

## Step 4: Start Server

```bash
npm run dev
```

Server starts at: `http://localhost:3000`

## Step 5: Access the App

### Main Pages

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login.html
- **Register**: http://localhost:3000/register.html
- **Player Dashboard**: http://localhost:3000/player-dashboard.html
- **Admin Dashboard**: http://localhost:3000/admin.html

### Default Admin Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT: Change admin password immediately!**

## Step 6: Test the System

### 1. Register a Player
- Go to `/register.html`
- Create a new account
- You'll be redirected to dashboard

### 2. Login as Admin
- Go to `/login.html`
- Use admin credentials
- Access admin dashboard

### 3. Create Tournament (Admin)
- Go to Admin Dashboard
- Fill tournament form:
  - Name: "Weekend Cup"
  - Entry Fee: 0 (FREE) or 100 (PAID)
  - Max Players: 16
- Click "Create Tournament"

### 4. Join Tournament (Player)
- Go to Player Dashboard
- View available tournaments
- Click "Join" (FREE) or "Pay & Join" (PAID)

### 5. Test Payments (if configured)
- Create PAID tournament
- Player clicks "Pay & Join"
- STK Push sent to phone
- Enter M-Pesa PIN
- Payment confirmed automatically

## Common Issues

### Database Connection Error

```
❌ Database initialization error
```

**Solution:**
- Check `DATABASE_URL` in `.env`
- Ensure Neon database is active
- Verify network connection

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Module Not Found

```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd backend
npm install
```

## Next Steps

1. **Configure PayFlow** - Set up M-Pesa payments
2. **Customize Theme** - Edit `frontend/assets/css/theme.css`
3. **Add Players** - Share registration link
4. **Create Tournaments** - Start managing leagues
5. **Deploy** - Push to production server

## Production Deployment

### Backend (Render Example)

1. Push to GitHub
2. Connect to Render
3. Add environment variables
4. Deploy

### Database (Neon)

1. Create account at neon.tech
2. Create database
3. Copy connection string
4. Add to `DATABASE_URL`

### Frontend

Already served by backend. For separate hosting:
- Build static files
- Deploy to Netlify/Vercel
- Update API base URL

## Support

- 📖 Full Documentation: `README.md`
- 🐛 Issues: GitHub Issues
- 💬 Questions: Check API docs

---

**Ready to play! ⚽**
