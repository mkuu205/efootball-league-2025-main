import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// API modules
import payflowRoutes from './api/payflow.js';
import playerAuthRoutes from './api/player-auth.js';
import dbSetupRoutes from './api/db-setup.js';
import initializeDatabase from './api/db-init.js';
import tournamentRoutes from './api/tournaments.js';
import fcmNotifications from './api/fcm-notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'eFootball League 2025 API',
    timestamp: new Date().toISOString()
  });
});

/* ===================== API ROUTES (ALWAYS FIRST) ===================== */

// Payments
payflowRoutes(app, supabaseAdmin);

// Auth
playerAuthRoutes(app, supabaseAdmin);

// DB setup
dbSetupRoutes(app, supabaseAdmin);

// ✅ Firebase Cloud Messaging (THE ONLY PUSH SYSTEM)
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

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/icons', express.static(path.join(__dirname, 'public/icons')));

/* ===================== SPA FALLBACK (FIXED) ===================== */
/**
 * ✅ /api/* never gets index.html
 * ✅ frontend routing still works
 */
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ===================== ERRORS ===================== */
app.use((err, _req, res, _next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });
});

/* ===================== START ===================== */
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: /api/health`);

  await initializeDatabase(supabaseAdmin);
  console.log('✅ Database initialized');
});
