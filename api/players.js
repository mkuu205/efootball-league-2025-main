// api/players.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';
const DB_NAME = 'efootball-league';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db(DB_NAME);
  cachedClient = client;
  cachedDb = db;
  console.log('✅ MongoDB connected (players.js)');
  return db;
}

// GET all players
module.exports = async (req, res) => {
  const db = await connectToDatabase();
  const collection = db.collection('players');

  try {
    if (req.method === 'GET') {
      const players = await collection.find().sort({ id: 1 }).toArray();
      return res.status(200).json({ success: true, players });
    }

    if (req.method === 'POST') {
      const newPlayer = req.body;
      if (!newPlayer.name || !newPlayer.team) {
        return res.status(400).json({ success: false, message: 'Missing player fields' });
      }

      // Auto-increment ID
      const last = await collection.find().sort({ id: -1 }).limit(1).toArray();
      newPlayer.id = last.length ? last[0].id + 1 : 1;
      newPlayer.createdAt = new Date();

      await collection.insertOne(newPlayer);
      return res.status(201).json({ success: true, player: newPlayer });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      updates.updatedAt = new Date();

      await collection.updateOne({ id: parseInt(id) }, { $set: updates });
      const updated = await collection.findOne({ id: parseInt(id) });
      return res.status(200).json({ success: true, player: updated });
    }

    if (req.method === 'DELETE') {
      const id = parseInt(req.query.id);
      await collection.deleteOne({ id });
      return res.status(200).json({ success: true, message: `Player ${id} deleted` });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });

  } catch (err) {
    console.error('❌ Player API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
