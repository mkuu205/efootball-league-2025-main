const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('efootball-league');
    cachedClient = client;
    cachedDb = db;
    console.log('✅ Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================
function calculatePlayerStats(playerId, results) {
  const playerResults = results.filter(result => 
    result.homePlayerId === playerId || result.awayPlayerId === playerId
  );

  let stats = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };

  playerResults.forEach(result => {
    const isHome = result.homePlayerId === playerId;
    const playerScore = isHome ? result.homeScore : result.awayScore;
    const opponentScore = isHome ? result.awayScore : result.homeScore;

    stats.played++;
    stats.goalsFor += playerScore || 0;
    stats.goalsAgainst += opponentScore || 0;

    if (playerScore > opponentScore) {
      stats.wins++;
      stats.points += 3;
    } else if (playerScore === opponentScore) {
      stats.draws++;
      stats.points += 1;
    } else {
      stats.losses++;
    }
  });

  stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
  return stats;
}

function getRecentForm(playerId, results, matches = 5) {
  const playerResults = results
    .filter(result => result.homePlayerId === playerId || result.awayPlayerId === playerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, matches);

  return playerResults.map(result => {
    const isHome = result.homePlayerId === playerId;
    const playerScore = isHome ? result.homeScore : result.awayScore;
    const opponentScore = isHome ? result.awayScore : result.homeScore;

    if (playerScore > opponentScore) return 'W';
    if (playerScore === opponentScore) return 'D';
    return 'L';
  }).reverse();
}

// ==================== SYSTEM & UTILITY API ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'online', 
    message: 'eFootball League 2025 API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    name: 'eFootball League API',
    description: 'Tournament Management System'
  });
});

// Send reset email
app.post('/api/send-reset-email', async (req, res) => {
  try {
    const { to_email, reset_link } = req.body;

    if (!to_email || !reset_link) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ffd700; margin: 0;">⚽ eFootball League 2025</h1>
          <p style="margin: 10px 0; opacity: 0.9;">Password Reset Request</p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding:20px; border-radius:8px; margin:20px 0;">
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reset_link}" style="display:inline-block;padding:12px 30px;background:#2575fc;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">
              🔐 Reset Password
            </a>
          </div>
          <p>Or copy this link: ${reset_link}</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: 'support@kishtechsite.online',
      to: to_email,
      subject: 'eFootball League 2025 - Password Reset',
      html: htmlContent,
    });

    res.json({ success: true, message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// ==================== PLAYERS API ====================

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const players = await db.collection('players').find().sort({ id: 1 }).toArray();
    res.json({ success: true, players });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single player
app.get('/api/players/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const playerId = parseInt(req.params.id);
    const player = await db.collection('players').findOne({ id: playerId });
    
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create player
app.post('/api/players', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newPlayer = req.body;
    
    // Validation
    if (!newPlayer.name || !newPlayer.team) {
      return res.status(400).json({ success: false, error: 'Name and team are required' });
    }

    // Check for duplicates
    const existingPlayer = await db.collection('players').findOne({ 
      name: newPlayer.name,
      team: newPlayer.team 
    });
    
    if (existingPlayer) {
      return res.status(400).json({ 
        success: false, 
        error: `Player "${newPlayer.name}" already exists in team ${newPlayer.team}` 
      });
    }
    
    // Generate ID
    const maxIdPlayer = await db.collection('players').find().sort({ id: -1 }).limit(1).toArray();
    newPlayer.id = maxIdPlayer.length > 0 ? maxIdPlayer[0].id + 1 : 1;
    
    newPlayer.createdAt = new Date();
    newPlayer.updatedAt = new Date();
    
    await db.collection('players').insertOne(newPlayer);
    res.json({ success: true, player: newPlayer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// In your server.js, add this route:
app.post('/api/seed-players', require('./api/seed-players'));
// Update player
app.put('/api/players/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const playerId = parseInt(req.params.id);
    const updates = req.body;
    
    updates.updatedAt = new Date();
    
    const result = await db.collection('players').updateOne(
      { id: playerId },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const updatedPlayer = await db.collection('players').findOne({ id: playerId });
    res.json({ success: true, player: updatedPlayer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete player
app.delete('/api/players/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const playerId = parseInt(req.params.id);
    
    const result = await db.collection('players').deleteOne({ id: playerId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    // Clean up related data
    await db.collection('fixtures').deleteMany({
      $or: [{ homePlayerId: playerId }, { awayPlayerId: playerId }]
    });
    
    await db.collection('results').deleteMany({
      $or: [{ homePlayerId: playerId }, { awayPlayerId: playerId }]
    });
    
    res.json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== FIXTURES API ====================

// Get all fixtures
app.get('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const fixtures = await db.collection('fixtures').find().sort({ date: 1, time: 1 }).toArray();
    res.json({ success: true, fixtures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single fixture
app.get('/api/fixtures/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const fixtureId = parseInt(req.params.id);
    const fixture = await db.collection('fixtures').findOne({ id: fixtureId });
    
    if (!fixture) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }
    
    res.json({ success: true, fixture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create fixture
app.post('/api/fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newFixture = req.body;
    
    // Validation
    if (!newFixture.homePlayerId || !newFixture.awayPlayerId || !newFixture.date) {
      return res.status(400).json({ success: false, error: 'Home player, away player, and date are required' });
    }

    if (newFixture.homePlayerId === newFixture.awayPlayerId) {
      return res.status(400).json({ success: false, error: 'Home and away players must be different' });
    }

    // Check for existing fixture
    const existingFixture = await db.collection('fixtures').findOne({
      homePlayerId: newFixture.homePlayerId,
      awayPlayerId: newFixture.awayPlayerId,
      date: newFixture.date
    });
    
    if (existingFixture) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fixture already exists for these players on this date' 
      });
    }
    
    // Generate ID
    const maxIdFixture = await db.collection('fixtures').find().sort({ id: -1 }).limit(1).toArray();
    newFixture.id = maxIdFixture.length > 0 ? maxIdFixture[0].id + 1 : 1;
    
    newFixture.createdAt = new Date();
    newFixture.updatedAt = new Date();
    newFixture.played = newFixture.played || false;
    
    await db.collection('fixtures').insertOne(newFixture);
    res.json({ success: true, fixture: newFixture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update fixture
app.put('/api/fixtures/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const fixtureId = parseInt(req.params.id);
    const updates = req.body;
    
    updates.updatedAt = new Date();
    
    const result = await db.collection('fixtures').updateOne(
      { id: fixtureId },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }
    
    const updatedFixture = await db.collection('fixtures').findOne({ id: fixtureId });
    res.json({ success: true, fixture: updatedFixture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete fixture
app.delete('/api/fixtures/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const fixtureId = parseInt(req.params.id);
    
    const fixture = await db.collection('fixtures').findOne({ id: fixtureId });
    if (!fixture) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }
    
    await db.collection('fixtures').deleteOne({ id: fixtureId });
    
    // Delete related result
    await db.collection('results').deleteOne({
      homePlayerId: fixture.homePlayerId,
      awayPlayerId: fixture.awayPlayerId,
      date: fixture.date
    });
    
    res.json({ success: true, message: 'Fixture deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RESULTS API ====================

// Get all results
app.get('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const results = await db.collection('results').find().sort({ date: -1 }).toArray();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single result
app.get('/api/results/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const resultId = parseInt(req.params.id);
    const result = await db.collection('results').findOne({ id: resultId });
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create result
app.post('/api/results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const newResult = req.body;
    
    // Validation
    if (!newResult.homePlayerId || !newResult.awayPlayerId || !newResult.date) {
      return res.status(400).json({ success: false, error: 'Home player, away player, and date are required' });
    }

    if (newResult.homePlayerId === newResult.awayPlayerId) {
      return res.status(400).json({ success: false, error: 'Home and away players must be different' });
    }

    // Check for existing result
    const existingResult = await db.collection('results').findOne({
      homePlayerId: newResult.homePlayerId,
      awayPlayerId: newResult.awayPlayerId,
      date: newResult.date
    });
    
    if (existingResult) {
      return res.status(400).json({ 
        success: false, 
        error: 'Result already exists for this fixture' 
      });
    }
    
    // Generate ID
    const maxIdResult = await db.collection('results').find().sort({ id: -1 }).limit(1).toArray();
    newResult.id = maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;
    
    newResult.createdAt = new Date();
    newResult.updatedAt = new Date();
    
    await db.collection('results').insertOne(newResult);
    
    // Mark fixture as played
    await db.collection('fixtures').updateOne(
      {
        homePlayerId: newResult.homePlayerId,
        awayPlayerId: newResult.awayPlayerId
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

// Update result
app.put('/api/results/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const resultId = parseInt(req.params.id);
    const updates = req.body;
    
    updates.updatedAt = new Date();
    
    const result = await db.collection('results').updateOne(
      { id: resultId },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }
    
    const updatedResult = await db.collection('results').findOne({ id: resultId });
    res.json({ success: true, result: updatedResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete result
app.delete('/api/results/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const resultId = parseInt(req.params.id);
    
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
    
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== STATISTICS & ANALYTICS API ====================

// Get league table
app.get('/api/league-table', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const [players, results] = await Promise.all([
      db.collection('players').find().toArray(),
      db.collection('results').find().toArray()
    ]);
    
    const tableData = players.map(player => {
      const stats = calculatePlayerStats(player.id, results);
      const form = getRecentForm(player.id, results, 5);
      
      return {
        id: player.id,
        name: player.name,
        team: player.team,
        played: stats.played,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDifference: stats.goalDifference,
        points: stats.points,
        form: form
      };
    });

    // Sort by points, GD, goals for
    const sortedTable = tableData.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    res.json({ success: true, table: sortedTable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const [players, fixtures, results] = await Promise.all([
      db.collection('players').find().toArray(),
      db.collection('fixtures').find().toArray(),
      db.collection('results').find().toArray()
    ]);

    const totalGoals = results.reduce((acc, result) => acc + result.homeScore + result.awayScore, 0);
    const playedMatches = results.length;
    const upcomingMatches = fixtures.filter(f => !f.played).length;

    const stats = {
      totalPlayers: players.length,
      totalFixtures: fixtures.length,
      playedFixtures: playedMatches,
      upcomingFixtures: upcomingMatches,
      totalGoals: totalGoals,
      averageGoals: playedMatches > 0 ? (totalGoals / playedMatches).toFixed(1) : 0,
      completionRate: fixtures.length > 0 ? ((playedMatches / fixtures.length) * 100).toFixed(1) : 0
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get player statistics
app.get('/api/player-stats/:id', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const playerId = parseInt(req.params.id);
    
    const [player, results] = await Promise.all([
      db.collection('players').findOne({ id: playerId }),
      db.collection('results').find().toArray()
    ]);
    
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const stats = calculatePlayerStats(playerId, results);
    const form = getRecentForm(playerId, results, 5);
    
    res.json({ 
      success: true, 
      player: { ...player, stats, form } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top scorers
app.get('/api/top-scorers', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const [players, results] = await Promise.all([
      db.collection('players').find().toArray(),
      db.collection('results').find().toArray()
    ]);
    
    const scorers = players.map(player => {
      let goals = 0;
      results.forEach(result => {
        if (result.homePlayerId === player.id) goals += result.homeScore;
        if (result.awayPlayerId === player.id) goals += result.awayScore;
      });
      
      return { ...player, goals };
    }).filter(player => player.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);

    res.json({ success: true, scorers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent form for all players
app.get('/api/recent-form', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const [players, results] = await Promise.all([
      db.collection('players').find().toArray(),
      db.collection('results').find().toArray()
    ]);
    
    const formData = players.map(player => ({
      id: player.id,
      name: player.name,
      form: getRecentForm(player.id, results, 5)
    }));

    res.json({ success: true, form: formData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BULK OPERATIONS API ====================

// Initialize database (clear all data)
app.post('/api/initialize', async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    await db.collection('players').deleteMany({});
    await db.collection('fixtures').deleteMany({});
    await db.collection('results').deleteMany({});

    res.json({ 
      success: true, 
      message: 'Database cleared successfully. Ready for new tournament.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset results only
app.post('/api/reset-results', async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    await db.collection('results').deleteMany({});
    await db.collection('fixtures').updateMany(
      { played: true },
      { $set: { played: false, updatedAt: new Date() } }
    );

    res.json({ 
      success: true, 
      message: 'All results have been reset successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate optimized fixtures
app.post('/api/generate-fixtures', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const players = await db.collection('players').find().toArray();
    
    if (players.length < 2) {
      return res.status(400).json({ success: false, error: 'Need at least 2 players to generate fixtures' });
    }

    // Clear existing fixtures
    await db.collection('fixtures').deleteMany({});
    
    // Generate round-robin fixtures
    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + (i + j) * 2);
        
        fixtures.push({
          id: fixtureId++,
          homePlayerId: players[i].id,
          awayPlayerId: players[j].id,
          date: matchDate.toISOString().split('T')[0],
          time: '15:00',
          venue: `Virtual Stadium ${String.fromCharCode(65 + ((i + j) % 3))}`,
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
      message: `Generated ${fixtures.length} fixtures successfully`,
      fixtures: fixtures.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export all data
app.get('/api/export-data', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const [players, fixtures, results] = await Promise.all([
      db.collection('players').find().toArray(),
      db.collection('fixtures').find().toArray(),
      db.collection('results').find().toArray()
    ]);

    const exportData = {
      players,
      fixtures,
      results,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      tournament: 'eFootball League 2025'
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import data
app.post('/api/import-data', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const importData = req.body;

    if (!importData.players || !importData.fixtures || !importData.results) {
      return res.status(400).json({ success: false, error: 'Invalid import data format' });
    }

    // Clear existing data
    await db.collection('players').deleteMany({});
    await db.collection('fixtures').deleteMany({});
    await db.collection('results').deleteMany({});

    // Import new data
    await db.collection('players').insertMany(importData.players);
    await db.collection('fixtures').insertMany(importData.fixtures);
    await db.collection('results').insertMany(importData.results);

    res.json({ 
      success: true, 
      message: 'Data imported successfully',
      imported: {
        players: importData.players.length,
        fixtures: importData.fixtures.length,
        results: importData.results.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create backup
app.get('/api/backup', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const [players, fixtures, results] = await Promise.all([
      db.collection('players').find().toArray(),
      db.collection('fixtures').find().toArray(),
      db.collection('results').find().toArray()
    ]);

    const backupData = {
      players,
      fixtures,
      results,
      backupDate: new Date().toISOString(),
      version: '1.0.0'
    };

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=efootball-backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== FRONTEND ROUTES ====================
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 eFootball League API running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`👑 Admin: http://localhost:${PORT}/admin.html`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
