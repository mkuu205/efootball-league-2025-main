import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// API route modules
import payflowRoutes from './api/payflow.js';
import playerAuthRoutes from './api/player-auth.js';
import dbSetupRoutes from './api/db-setup.js';
import initializeDatabase from './api/db-init.js';
import tournamentRoutes from './api/tournaments.js';
import fcmNotifications from './api/fcm-notifications.js';

dotenv.config();

/* ===================== PATHS ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===================== APP ===================== */
const app = express();
const PORT = process.env.PORT || 3000;

/* ===================== MIDDLEWARE ===================== */
app.use(cors());
app.use(express.json());

/* ===================== SUPABASE ===================== */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===================== HEALTH ===================== */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'eFootball League 2025 API',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

/* ===================== ✅ API ROUTES (FIRST) ===================== */

// Payments
payflowRoutes(app, supabaseAdmin);

// Auth
playerAuthRoutes(app, supabaseAdmin);

// Database setup
dbSetupRoutes(app, supabaseAdmin);

// Firebase Cloud Messaging (ONLY push system)
fcmNotifications(app);

// Tournaments
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

/* ===================== STATIC FILES ===================== */
/**
 * index.html is NOT here
 * only assets live in /public
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/icons', express.static(path.join(__dirname, 'public/icons')));

/* ===================== ✅ SPA FALLBACK ===================== */
/**
 * index.html is at PROJECT ROOT
 * /api/* must NEVER be redirected
 */
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });
});

/* ===================== START SERVER ===================== */
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: /api/health`);

  await initializeDatabase(supabaseAdmin);
  console.log('✅ Database initialized');
});
