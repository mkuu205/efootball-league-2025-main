const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);


const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());

// Serve static files correctly for deployment
app.use(express.static(__dirname, {
  index: ['index.html'],
  extensions: ['html']
}));

// Specific static file routes for better reliability
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/php', express.static(path.join(__dirname, 'php')));
app.use('/icons', express.static(path.join(__dirname, 'icons'))); 

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // Fixed MongoDB connection - removed deprecated options
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

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'eFootball League 2025 API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || "mail.kishtechsite.online",
    port: process.env.EMAIL_PORT || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || "support@kishtechsite.online",
        pass: process.env.EMAIL_PASS || "Brasho2425"
    }
};

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Players endpoints
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

// Fixtures endpoints
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

// Results endpoints
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

// Initialize database
app.post('/api/initialize', async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    // Clear existing data
    await db.collection('players').deleteMany({});
    await db.collection('fixtures').deleteMany({});
    await db.collection('results').deleteMany({});

    // Insert sample players
    const samplePlayers = [
      { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138, 
        teamColor: '#000000', 
        defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        createdAt: new Date() 
      },
      { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', 
        createdAt: new Date() 
      },
      { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042, 
        teamColor: '#034694', 
        defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        createdAt: new Date() 
      },
      { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700, 
        teamColor: '#c8102e', 
        defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        createdAt: new Date() 
      },
      { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792, 
        teamColor: '#003399', 
        defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        createdAt: new Date() 
      },
      { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448, 
        teamColor: '#da291c', 
        defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        createdAt: new Date() 
      },
      { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110, 
        teamColor: '#7c2c3b', 
        defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        createdAt: new Date() 
      }
    ];

    await db.collection('players').insertMany(samplePlayers);
    
    // Generate fixtures
    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    
    const matchPairs = [];
    
    for (let i = 0; i < samplePlayers.length; i++) {
      for (let j = i + 1; j < samplePlayers.length; j++) {
        matchPairs.push([samplePlayers[i], samplePlayers[j]]);
      }
    }
    
    matchPairs.forEach(([player1, player2], index) => {
      const matchDate = new Date(startDate);
      matchDate.setDate(matchDate.getDate() + index * 2);
      
      fixtures.push({
        id: fixtureId++,
        homePlayerId: player1.id,
        awayPlayerId: player2.id,
        date: matchDate.toISOString().split('T')[0],
        time: '15:00',
        venue: 'Virtual Stadium ' + String.fromCharCode(65 + (index % 3)),
        played: false,
        isHomeLeg: true,
        createdAt: new Date()
      });
    });
    
    await db.collection('fixtures').insertMany(fixtures);
    
    res.json({ 
      success: true, 
      message: 'Database initialized with simplified fixtures (14 matches)', 
      players: samplePlayers.length, 
      fixtures: fixtures.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve PWA files
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'service-worker.js'));
});

// Serve admin.html specifically
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve all other routes with index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
