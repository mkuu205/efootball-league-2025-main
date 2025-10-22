// server.js - Safe Deployment Version for eFootball League 2025
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// --------------------
// MongoDB Connection
// --------------------
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set! Please add it in your environment variables.');
  process.exit(1);
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = client.db(); // default DB from URI
    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'eFootball League 2025 API is running!',
    timestamp: new Date().toISOString()
  });
});

// Password reset API
app.post('/send-reset-email', async (req, res) => {
    const { to_email, reset_link } = req.body;
    try {
        await sendResetEmail(to_email, reset_link);
        res.json({ success: true, message: 'Password reset email sent' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const players = await db.collection('players').find().toArray();
    const fixtures = await db.collection('fixtures').find().toArray();
    const results = await db.collection('results').find().toArray();

    res.json({
      success: true,
      players,
      fixtures,
      results,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Players ====================
app.get('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const players = await db.collection('players').find().toArray();
    res.json({ success: true, players });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newPlayer = req.body;

    if (!newPlayer.id) {
      const maxIdPlayer = await db.collection('players').find().sort({ id: -1 }).limit(1).toArray();
      newPlayer.id = maxIdPlayer.length > 0 ? maxIdPlayer[0].id + 1 : 1;
    }

    newPlayer.createdAt = new Date();
    await db.collection('players').insertOne(newPlayer);
    res.json({ success: true, player: newPlayer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { id, ...updates } = req.body;
    updates.updatedAt = new Date();

    await db.collection('players').updateOne(
      { id: parseInt(id) },
      { $set: updates }
    );

    const updatedPlayer = await db.collection('players').findOne({ id: parseInt(id) });
    res.json({ success: true, player: updatedPlayer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const playerId = parseInt(req.query.id);
    await db.collection('players').deleteOne({ id: playerId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Fixtures ====================
app.get('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const fixtures = await db.collection('fixtures').find().toArray();
    res.json({ success: true, fixtures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newFixture = req.body;

    if (!newFixture.id) {
      const maxIdFixture = await db.collection('fixtures').find().sort({ id: -1 }).limit(1).toArray();
      newFixture.id = maxIdFixture.length > 0 ? maxIdFixture[0].id + 1 : 1;
    }

    newFixture.createdAt = new Date();
    await db.collection('fixtures').insertOne(newFixture);
    res.json({ success: true, fixture: newFixture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { id, ...updates } = req.body;
    updates.updatedAt = new Date();

    await db.collection('fixtures').updateOne(
      { id: parseInt(id) },
      { $set: updates }
    );

    const updatedFixture = await db.collection('fixtures').findOne({ id: parseInt(id) });
    res.json({ success: true, fixture: updatedFixture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const fixtureId = parseInt(req.query.id);
    await db.collection('fixtures').deleteOne({ id: fixtureId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Results ====================
app.get('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const results = await db.collection('results').find().toArray();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newResult = req.body;

    if (!newResult.id) {
      const maxIdResult = await db.collection('results').find().sort({ id: -1 }).limit(1).toArray();
      newResult.id = maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;
    }

    newResult.createdAt = new Date();
    await db.collection('results').insertOne(newResult);

    // Mark fixture as played
    await db.collection('fixtures').updateOne(
      {
        homePlayerId: newResult.homePlayerId,
        awayPlayerId: newResult.awayPlayerId,
        played: false
      },
      { $set: { played: true, updatedAt: new Date() } }
    );

    res.json({ success: true, result: newResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { id, ...updates } = req.body;
    updates.updatedAt = new Date();

    await db.collection('results').updateOne(
      { id: parseInt(id) },
      { $set: updates }
    );

    const updatedResult = await db.collection('results').findOne({ id: parseInt(id) });
    res.json({ success: true, result: updatedResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const resultId = parseInt(req.query.id);
    const result = await db.collection('results').findOne({ id: resultId });
    await db.collection('results').deleteOne({ id: resultId });

    if (result) {
      await db.collection('fixtures').updateOne(
        {
          homePlayerId: result.homePlayerId,
          awayPlayerId: result.awayPlayerId
        },
        { $set: { played: false, updatedAt: new Date() } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Initialize Database ====================
app.post('/api/initialize', async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    // Clear collections
    await db.collection('players').deleteMany({});
    await db.collection('fixtures').deleteMany({});
    await db.collection('results').deleteMany({});

    // Insert sample players and fixtures (simplified)
    // ... same sample data as your working version ...
    // Keep your 7 sample players and 14 simplified fixtures here

    res.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/health`);
});
