import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import db from './src/config/db.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import tournamentRoutes from './src/routes/tournaments.js';
import payflowRoutes from './src/routes/payflow.js';
import notificationRoutes from './src/routes/notifications.js';
import leagueRoutes from './src/routes/league.js';
import playerRoutes from './src/routes/player.js';
import exportRoutes from './src/routes/export.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for now
        'https://cdn.jsdelivr.net', // Bootstrap JS
        'https://cdnjs.cloudflare.com' // Font Awesome if needed
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles
        'https://cdn.jsdelivr.net', // Bootstrap CSS
        'https://cdnjs.cloudflare.com' // Font Awesome CSS
      ],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://cdn.jsdelivr.net' // Bootstrap source maps
      ],
      fontSrc: [
        "'self'",
        'https://cdnjs.cloudflare.com' // Font Awesome fonts
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'data:'], // Allow data: URIs for audio/video
      frameSrc: ["'none'"]
    }
  }
}));
app.use(cors({
  origin: ['http://localhost:3000', 'https://tournament.kishtech.co.ke'],
  credentials: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
});

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10
});

app.use('/api/', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// HTML pages - MUST be before static files to prevent SPA fallback
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/player-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/player-dashboard.html'));
});

// Static files - serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/payflow', paymentLimiter, payflowRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', leagueRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'eFootball League 2026 API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// SPA fallback - catches all non-API, non-HTML routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `The requested API endpoint does not exist: ${req.originalUrl}`
  });
});

// Error handler - MUST be after all routes
app.use((err, req, res, next) => {
  console.error('❌ GLOBAL ERROR:', err);
  
  // Always return JSON, never HTML
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Database initialization - runs once on startup
async function initializeDatabase() {
  try {
    console.log('🔧 Checking database schema...');
    
    // Test if tables exist first
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'player_accounts'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Tables not found, creating schema...');
      const schema = fs.readFileSync(path.join(__dirname, 'src/config/schema.sql'), 'utf8');
      await db.query(schema);
      console.log('✅ Database schema created successfully');
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.log('⚠️  Database may need manual schema setup - see schema.sql');
    // Don't crash the server - let it run even if DB init fails
  }
}

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 eFootball League 2026 - Production Server`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL (Neon)`);
  console.log(`🔐 Auth: JWT + bcrypt`);
  console.log(`🔔 Notifications: Database-driven`);
  console.log(`💳 Payments: PayFlow M-Pesa`);
  console.log(`${'='.repeat(60)}\n`);
  
  await initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  await db.pool.end();
  process.exit(0);
});

export default app;
 