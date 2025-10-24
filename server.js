// server.js
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
app.use(express.static('public')); // Single static directory

// ==================== SUPABASE ====================
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==================== RESEND EMAIL ====================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== DEFAULT PLAYERS ====================
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

    const admin_email = process.env.ADMIN_EMAIL;
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
      from: admin_email,
      to: to_email,
      subject: 'eFootball League 2025 - Password Reset Request',
      html: htmlContent,
    });

    console.log('✅ Email sent via Resend:', emailResponse.id);
    res.json({ success: true, message: 'Password reset email sent successfully', emailId: emailResponse.id });

  } catch (error) {
    console.error('❌ Resend email failed:', error);
    res.status(500).json({ success: false, message: 'Failed to send email via Resend: ' + error.message });
  }
});

// ==================== AUTH ROUTES ====================
// Admin verification endpoint
app.get('/api/auth/admin', async (req, res) => {
  try {
    const { data: { session }, error } = await supabaseAdmin.auth.getSession();
    if (error) throw error;

    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
    res.json({ success: true, isAdmin, user: session?.user || null });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUPABASE INITIALIZE ====================
app.post('/api/initialize', async (req, res) => {
  res.json({
    success: true,
    message: 'Supabase database is ready!',
    database: 'Supabase',
    timestamp: new Date().toISOString()
  });
});

// ==================== ROUTES ====================
app.get('/auth.html', (req, res) => res.sendFile(path.join(__dirname, 'auth.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
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
});
