const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const webpush = require('web-push');
require('dotenv').config();

// ==================== APP SETUP ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== SUPABASE ====================
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==================== RESEND EMAIL ====================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== DEFAULT PLAYERS (optional) ====================
const DEFAULT_PLAYERS = [
  { id: 1, name: 'alwaysresistance', team: 'Kenya', photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', strength: 3138, team_color: '#000000', default_photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg' },
  { id: 2, name: 'lildrip035', team: 'Chelsea', photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', strength: 3100, team_color: '#034694', default_photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg' },
  { id: 3, name: 'Sergent white', team: 'Chelsea', photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', strength: 3042, team_color: '#034694', default_photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg' },
  { id: 4, name: 'skangaKe254', team: 'Liverpool', photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', strength: 2700, team_color: '#c8102e', default_photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg' },
  { id: 5, name: 'Drexas', team: 'Everton', photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', strength: 2792, team_color: '#003399', default_photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg' },
  { id: 6, name: 'Collo leevan', team: 'Manchester United', photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', strength: 2448, team_color: '#da291c', default_photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg' },
  { id: 7, name: 'captainkenn', team: 'West Ham', photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', strength: 3110, team_color: '#7c2c3b', default_photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg' },
  { id: 8, name: 'Bora kesho', team: 'Man U', photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg', strength: 3177, team_color: '#DA291C', default_photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg' }
];

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'eFootball League 2025 API with Supabase is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'Supabase'
  });
});

// ==================== RESET EMAIL ====================
app.post('/api/send-reset-email', async (req, res) => {
  try {
    const { to_email, reset_link } = req.body;

    if (!to_email || !reset_link) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to_email and reset_link' });
    }

    const admin_email = 'support@kishtechsite.online';
    if (to_email !== admin_email) {
      return res.status(403).json({ success: false, message: 'Only admin email can request password reset' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #6a11cb, #2575fc); color: white; border-radius: 10px;">
        <h1 style="text-align:center;">⚽ eFootball League 2025</h1>
        <p>Hello Administrator, click below to reset your password:</p>
        <a href="${reset_link}" style="display:inline-block;padding:12px 25px;background:#2575fc;color:white;text-decoration:none;border-radius:5px;">
          🔐 Reset Password
        </a>
        <p style="margin-top:20px;">If the button doesn't work, copy and paste this link:</p>
        <code>${reset_link}</code>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: 'support@kishtechsite.online',
      to: to_email,
      subject: 'eFootball League 2025 - Password Reset Request',
      html: htmlContent,
    });

    console.log('✅ Email sent via Resend:', emailResponse.id);
    res.json({ success: true, message: 'Password reset email sent successfully', emailId: emailResponse.id });

  } catch (error) {
    console.error('❌ Resend email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email via Resend: ' + error.message
    });
  }
});

// ==================== SUPABASE INITIALIZE ====================
app.post('/api/initialize', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Supabase database is ready! Data is managed client-side with Supabase.',
      database: 'Supabase',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== API ROUTES ====================
require('./api/players')(app, supabaseAdmin);
require('./api/fixtures')(app, supabaseAdmin);
require('./api/results')(app, supabaseAdmin);
require('./api/league-table')(app, supabaseAdmin);
require('./api/initialize')(app, supabaseAdmin);

// ==================== PUSH NOTIFICATIONS ====================
webpush.setVapidDetails(
  "mailto:support@kishtechsite.online",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Temporary in-memory storage
let subscriptions = [];

// Save subscription
app.post("/api/save-subscription", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  console.log("✅ New push subscription saved");
  res.status(201).json({ message: "Subscription saved successfully" });
});

// Send notification to all subscribers
app.post("/api/send-notification", async (req, res) => {
  const { title, body, url } = req.body;
  const payload = JSON.stringify({
    title: title || "eFootball League 2025",
    body: body || "Match update available!",
    url: url || "https://tournament.kishtechsite.online/"
  });

  const failed = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      console.error("❌ Failed to send notification:", err.message);
      failed.push(sub);
    }
  }

  res.json({ success: true, message: "Notifications sent!", failedCount: failed.length });
});


// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/icons', express.static(path.join(__dirname, 'public/icons')));

app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));


// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: Supabase (Client-side)`);
});
