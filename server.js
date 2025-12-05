import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import dotenv from 'dotenv';

// Import API route modules
import payflowRoutes from './api/payflow.js';
import playerAuthRoutes from './api/player-auth.js';
import dbSetupRoutes from './api/db-setup.js';
import initializeDatabase from './api/db-init.js';
import tournamentRoutes from './api/tournaments.js';
import fcmNotifications from './api/fcm-notifications.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Debug: Check if environment variables are loaded
console.log('🔧 Environment check:');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);

// Supabase Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://zliedzrqzvywlsyfggcq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI'
);

// Conditional Resend setup
let resend = null;
if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
  try {
    const { Resend } = await import('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Resend:', error.message);
    resend = null;
  }
} else {
  console.log('📧 Resend: Not configured (missing or invalid API key)');
}

// Web Push Configuration
webpush.setVapidDetails(
  "mailto:support@kishtechsite.online",
  process.env.VAPID_PUBLIC_KEY || "BEOg5DAEgXVUZfVsnaDe72yBrCAJp4mEPs150PwJpaHUbc8kgSOp0Wz9pgzJd8GMuzQfoxbECKCjZ7HGnpsrwhs",
  process.env.VAPID_PRIVATE_KEY || "your-private-key-here"
);

// Health Check
app.get('/api/health', (req, res) => {
  const emailStatus = resend ? 'Resend Connected' : 'Resend Not Configured';
  
  res.json({
    status: 'online',
    message: 'eFootball League 2025 API with Supabase is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'Supabase',
    email: emailStatus,
    resend_configured: !!resend
  });
});

// Register PayFlow payment routes
payflowRoutes(app, supabaseAdmin);

// Register Player Auth routes
playerAuthRoutes(app, supabaseAdmin);

// Register Database Setup routes
dbSetupRoutes(app, supabaseAdmin);

// Register Firebase Cloud Messaging routes
fcmNotifications(app);

// Initialize and Register Tournament routes
tournamentRoutes.initTournaments(supabaseAdmin);
app.get('/api/tournaments', tournamentRoutes.getTournaments);
app.get('/api/tournaments/:id', tournamentRoutes.getTournament);
app.post('/api/tournaments', tournamentRoutes.createTournament);
app.put('/api/tournaments/:id', tournamentRoutes.updateTournament);
app.delete('/api/tournaments/:id', tournamentRoutes.deleteTournament);
app.post('/api/tournaments/join', tournamentRoutes.joinTournament);
app.post('/api/tournaments/:id/generate-fixtures', tournamentRoutes.generateFixtures);
app.post('/api/tournaments/record-result', tournamentRoutes.recordResult);
app.post('/api/tournaments/initialize-main', tournamentRoutes.initializeMainTournament);

// Password Reset Email Endpoint
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

    if (!resend) {
      console.log('📧 Password reset requested (Resend not configured):');
      console.log('To:', to_email);
      console.log('Reset Link:', reset_link);
      
      return res.json({ 
        success: true, 
        message: 'Email service not configured. Please use this reset link manually:',
        reset_link: reset_link,
        manual_mode: true
      });
    }

    console.log('📧 Sending password reset email via Resend...');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #2575fc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>⚽ eFootball League 2025</h1>
                  <p>Password Reset Request</p>
              </div>
              <div class="content">
                  <h2>Hello Administrator,</h2>
                  <p>You have requested to reset your password for the eFootball League 2025 admin panel.</p>
                  <p>Click the button below to reset your password:</p>
                  <p style="text-align: center;">
                      <a href="${reset_link}" class="button">🔐 Reset Password</a>
                  </p>
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                      ${reset_link}
                  </p>
                  <p><strong>This link will expire in 1 hour.</strong></p>
                  <p>If you didn't request this password reset, please ignore this email.</p>
              </div>
              <div class="footer">
                  <p>eFootball League 2025 &copy; All rights reserved</p>
                  <p>This is an automated message, please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'eFootball League <support@kishtechsite.online>',
      to: [to_email],
      subject: '🔐 Password Reset - eFootball League 2025',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email via Resend: ' + error.message
      });
    }

    console.log('✅ Password reset email sent via Resend:', data.id);
    res.json({ 
      success: true, 
      message: 'Password reset email sent successfully!',
      emailId: data.id
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + error.message
    });
  }
});

// Push Notifications
let subscriptions = [];

app.post("/api/save-subscription", (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  console.log("✅ New push subscription saved");
  res.status(201).json({ message: "Subscription saved successfully" });
});

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

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/icons', express.static(path.join(__dirname, 'public/icons')));

app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/player-login.html', (req, res) => res.sendFile(path.join(__dirname, 'player-login.html')));
app.get('/player-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'player-dashboard.html')));
app.get('/setup.html', (req, res) => res.sendFile(path.join(__dirname, 'setup.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Error Handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  
  // Initialize database tables
  await initializeDatabase(supabaseAdmin);
  console.log(`🔗 API: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: Supabase`);
  
  if (resend) {
    console.log(`📧 Email: Resend Connected`);
  } else {
    console.log(`📧 Email: Resend Not Configured - Add RESEND_API_KEY to .env file`);
  }
});