const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
//const PORT = process.env.PORT || 10000;
// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';

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
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    const db = client.db('efootball-league');
    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    // Don't throw error - allow app to run with local storage
    return { client: null, db: null };
  }
}

// ==================== ENHANCED API ROUTES ====================

// Health check with MongoDB status
app.get('/api/health', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const mongoStatus = db ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'online', 
      message: 'eFootball League 2025 API is running!',
      mongodb: mongoStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'online',
      message: 'eFootball League 2025 API is running!',
      mongodb: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all data with fallback
app.get('/api/data', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      return res.json({
        success: true,
        players: [],
        fixtures: [],
        results: [],
        lastUpdate: new Date().toISOString(),
        usingLocalStorage: true
      });
    }
    
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
    res.status(500).json({
      success: false,
      error: error.message,
      usingLocalStorage: true
    });
  }
});

// Enhanced Players endpoints with validation
app.get('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      return res.json({ success: true, players: [] });
    }
    
    const players = await db.collection('players').find().sort({ id: 1 }).toArray();
    res.json({ success: true, players });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newPlayer = req.body;
    
    // Validation
    if (!newPlayer.name || !newPlayer.team) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and team are required' 
      });
    }
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable - using local storage' 
      });
    }
    
    // Generate ID if not provided
    if (!newPlayer.id) {
      const maxIdPlayer = await db.collection('players').find().sort({ id: -1 }).limit(1).toArray();
      newPlayer.id = maxIdPlayer.length > 0 ? maxIdPlayer[0].id + 1 : 1;
    }
    
    // Set default values
    newPlayer.strength = newPlayer.strength || 2500;
    newPlayer.defaultPhoto = newPlayer.defaultPhoto || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${newPlayer.name.charAt(0)}`;
    newPlayer.photo = newPlayer.photo || newPlayer.defaultPhoto;
    newPlayer.createdAt = new Date();
    newPlayer.updatedAt = new Date();
    
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
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    updates.updatedAt = new Date();
    const result = await db.collection('players').updateOne(
      { id: parseInt(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
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
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    const result = await db.collection('players').deleteOne({ id: playerId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    // Also delete related fixtures and results
    await db.collection('fixtures').deleteMany({
      $or: [
        { homePlayerId: playerId },
        { awayPlayerId: playerId }
      ]
    });
    
    await db.collection('results').deleteMany({
      $or: [
        { homePlayerId: playerId },
        { awayPlayerId: playerId }
      ]
    });
    
    res.json({ success: true, message: 'Player and related data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced Fixtures endpoints
app.get('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      return res.json({ success: true, fixtures: [] });
    }
    
    const fixtures = await db.collection('fixtures').find().sort({ date: 1, time: 1 }).toArray();
    res.json({ success: true, fixtures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newFixture = req.body;
    
    // Validation
    if (!newFixture.homePlayerId || !newFixture.awayPlayerId || !newFixture.date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Home player, away player, and date are required' 
      });
    }
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    // Check if players are different
    if (newFixture.homePlayerId === newFixture.awayPlayerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Home and away players must be different' 
      });
    }
    
    // Generate ID if not provided
    if (!newFixture.id) {
      const maxIdFixture = await db.collection('fixtures').find().sort({ id: -1 }).limit(1).toArray();
      newFixture.id = maxIdFixture.length > 0 ? maxIdFixture[0].id + 1 : 1;
    }
    
    // Set default values
    newFixture.played = false;
    newFixture.time = newFixture.time || '15:00';
    newFixture.venue = newFixture.venue || 'Virtual Stadium';
    newFixture.isHomeLeg = newFixture.isHomeLeg !== undefined ? newFixture.isHomeLeg : true;
    newFixture.createdAt = new Date();
    newFixture.updatedAt = new Date();
    
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
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    updates.updatedAt = new Date();
    const result = await db.collection('fixtures').updateOne(
      { id: parseInt(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }
    
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
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    const result = await db.collection('fixtures').deleteOne({ id: fixtureId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced Results endpoints
app.get('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      return res.json({ success: true, results: [] });
    }
    
    const results = await db.collection('results').find().sort({ date: -1 }).toArray();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newResult = req.body;
    
    // Validation
    if (!newResult.homePlayerId || !newResult.awayPlayerId || 
        newResult.homeScore === undefined || newResult.awayScore === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Home player, away player, and scores are required' 
      });
    }
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    // Check if players are different
    if (newResult.homePlayerId === newResult.awayPlayerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Home and away players must be different' 
      });
    }
    
    // Generate ID if not provided
    if (!newResult.id) {
      const maxIdResult = await db.collection('results').find().sort({ id: -1 }).limit(1).toArray();
      newResult.id = maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;
    }
    
    // Set default values
    newResult.date = newResult.date || new Date().toISOString().split('T')[0];
    newResult.createdAt = new Date();
    newResult.updatedAt = new Date();
    
    await db.collection('results').insertOne(newResult);
    
    // Mark corresponding fixture as played
    await db.collection('fixtures').updateOne(
      {
        homePlayerId: newResult.homePlayerId,
        awayPlayerId: newResult.awayPlayerId,
        played: false
      },
      { 
        $set: { 
          played: true, 
          updatedAt: new Date() 
        } 
      }
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
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    updates.updatedAt = new Date();
    const result = await db.collection('results').updateOne(
      { id: parseInt(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
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
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    const result = await db.collection('results').findOne({ id: resultId });
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
    await db.collection('results').deleteOne({ id: resultId });
    
    // Mark fixture as unplayed
    await db.collection('fixtures').updateOne(
      {
        homePlayerId: result.homePlayerId,
        awayPlayerId: result.awayPlayerId
      },
      { 
        $set: { 
          played: false, 
          updatedAt: new Date() 
        } 
      }
    );
    
    res.json({ success: true, message: 'Result deleted and fixture reset' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Bulk operations for better performance
app.post('/api/fixtures/bulk', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { fixtures } = req.body;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }
    
    if (!fixtures || !Array.isArray(fixtures)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fixtures array is required' 
      });
    }
    
    // Add timestamps and ensure IDs
    const fixturesWithIds = fixtures.map((fixture, index) => ({
      ...fixture,
      id: fixture.id || Date.now() + index,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await db.collection('fixtures').insertMany(fixturesWithIds);
    res.json({ success: true, count: fixturesWithIds.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Search and filter endpoints
app.get('/api/fixtures/upcoming', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      return res.json({ success: true, fixtures: [] });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const fixtures = await db.collection('fixtures')
      .find({ 
        played: false,
        date: { $gte: today }
      })
      .sort({ date: 1, time: 1 })
      .limit(10)
      .toArray();
    
    res.json({ success: true, fixtures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      return res.json({ 
        success: true, 
        stats: {},
        usingLocalStorage: true 
      });
    }
    
    const playersCount = await db.collection('players').countDocuments();
    const fixturesCount = await db.collection('fixtures').countDocuments();
    const playedFixtures = await db.collection('fixtures').countDocuments({ played: true });
    const resultsCount = await db.collection('results').countDocuments();
    
    // Calculate total goals
    const results = await db.collection('results').find().toArray();
    const totalGoals = results.reduce((sum, result) => sum + result.homeScore + result.awayScore, 0);
    
    res.json({
      success: true,
      stats: {
        players: playersCount,
        fixtures: fixturesCount,
        playedFixtures: playedFixtures,
        results: resultsCount,
        completionRate: fixturesCount > 0 ? Math.round((playedFixtures / fixturesCount) * 100) : 0,
        totalGoals: totalGoals,
        averageGoals: playedFixtures > 0 ? (totalGoals / playedFixtures).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced Initialize database - WITH PROPER ERROR HANDLING
app.post('/api/initialize', async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable - cannot initialize' 
      });
    }

    // Clear existing data
    await db.collection('players').deleteMany({});
    await db.collection('fixtures').deleteMany({});
    await db.collection('results').deleteMany({});

    // Insert sample players WITH FIXED IMAGE URL
    const samplePlayers = [
      { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138, 
        teamColor: '#000000', 
        defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700, 
        teamColor: '#c8102e', 
        defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792, 
        teamColor: '#003399', 
        defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448, 
        teamColor: '#da291c', 
        defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110, 
        teamColor: '#7c2c3b', 
        defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.collection('players').insertMany(samplePlayers);
    
    // Generate SIMPLIFIED fixtures (only 21 instead of 84 - one match between each pair)
    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    
    // Create all possible match combinations
    for (let i = 0; i < samplePlayers.length; i++) {
      for (let j = i + 1; j < samplePlayers.length; j++) {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + (fixtureId - 1) * 2);
        
        fixtures.push({
          id: fixtureId++,
          homePlayerId: samplePlayers[i].id,
          awayPlayerId: samplePlayers[j].id,
          date: matchDate.toISOString().split('T')[0],
          time: '15:00',
          venue: 'Virtual Stadium ' + String.fromCharCode(65 + (fixtureId % 3)),
          played: false,
          isHomeLeg: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    await db.collection('fixtures').insertMany(fixtures);
    
    res.json({ 
      success: true, 
      message: 'Database initialized successfully', 
      players: samplePlayers.length, 
      fixtures: fixtures.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Reset only results
app.post('/api/reset-results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database unavailable' 
      });
    }

    // Clear results
    await db.collection('results').deleteMany({});
    
    // Reset all fixtures to unplayed
    await db.collection('fixtures').updateMany(
      { played: true },
      { 
        $set: { 
          played: false, 
          updatedAt: new Date() 
        } 
      }
    );
    
    res.json({ 
      success: true, 
      message: 'All results cleared and fixtures reset' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Specific page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found' 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled Error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 eFootball League 2025 server running on port ${PORT}`);
});
