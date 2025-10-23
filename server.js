const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // ✅ Load environment variables


const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Create a server-side Supabase client using the service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// ==================== SERVER ================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== API ROUTES ====================

// Health check
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

// Send reset email via Resend
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
      <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ffd700; margin: 0;">⚽ eFootball League 2025</h1>
          <p style="margin: 10px 0; opacity: 0.9;">Tournament Management System</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding:20px; border-radius:8px; margin:20px 0;">
          <h2 style="color: #ffd700;">Password Reset Request</h2>
          <p>Hello Administrator,</p>
          <p>You requested to reset your admin password for the eFootball League 2025 system.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reset_link}" style="display:inline-block;padding:12px 30px;background:#2575fc;color:white;text-decoration:none;border-radius:5px;font-weight:bold;font-size:16px;">
              🔐 Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <div style="background: rgba(0,0,0,0.3); padding:10px; border-radius:5px; word-break:break-all; margin:10px 0;">
            <code style="color:#ffd700;">${reset_link}</code>
          </div>
          <div style="background: rgba(255,215,0,0.2); padding:15px; border-radius:5px; margin:20px 0;">
            <p style="margin:0; color:#ffd700;"><strong>⚠️ Important:</strong> This reset link will expire in 1 hour.</p>
          </div>
        </div>
        <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.3);">
          <p style="margin:5px 0; opacity:0.8; font-size:14px;">eFootball League 2025 Tournament System<br>Automated Email - Do not reply</p>
        </div>
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
      message: 'Failed to send email via Resend: ' + error.message,
      fallback_message: `Please use this reset link manually: ${req.body.reset_link}`
    });
  }
});

// Initialize database endpoint (for Supabase setup)
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

// ==================== LOAD MODULAR API ROUTES ====================
require('./api/players')(app, supabaseAdmin);
require('./api/fixtures')(app, supabaseAdmin);
require('./api/results')(app, supabaseAdmin);
require('./api/league-table')(app, supabaseAdmin);
require('./api/initialize')(app, supabaseAdmin);


// ==================== STATIC FILES ====================
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/icons', express.static(path.join(__dirname, 'public/icons')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Start server with error handling
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏠 Host: 0.0.0.0`);
  console.log(`🗄️ Database: Supabase (Client-side)`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
