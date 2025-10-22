// api/initialize.js - Just clear database, don't add samples
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('efootball-league');
  cachedDb = db;
  return db;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();

    // Clear all data (empty database)
    await db.collection('players').deleteMany({});
    await db.collection('fixtures').deleteMany({});
    await db.collection('results').deleteMany({});

    return res.status(200).json({ 
      success: true, 
      message: 'Database cleared successfully. Add players manually or use /api/seed-players to add sample players.' 
    });

  } catch (error) {
    console.error('Initialize API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
