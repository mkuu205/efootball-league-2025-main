// api/results.js
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
  console.log('✅ MongoDB connected (results.js)');
  return db;
}

module.exports = async (req, res) => {
  const db = await connectToDatabase();
  const collection = db.collection('results');
  const fixtures = db.collection('fixtures');

  try {
    if (req.method === 'GET') {
      const results = await collection.find().sort({ id: 1 }).toArray();
      return res.status(200).json({ success: true, results });
    }

    if (req.method === 'POST') {
      const newResult = req.body;
      if (!newResult.homePlayerId || !newResult.awayPlayerId) {
        return res.status(400).json({ success: false, message: 'Missing result fields' });
      }

      const last = await collection.find().sort({ id: -1 }).limit(1).toArray();
      newResult.id = last.length ? last[0].id + 1 : 1;
      newResult.createdAt = new Date();

      await collection.insertOne(newResult);

      // Mark fixture as played
      await fixtures.updateOne(
        { homePlayerId: newResult.homePlayerId, awayPlayerId: newResult.awayPlayerId },
        { $set: { played: true, updatedAt: new Date() } }
      );

      return res.status(201).json({ success: true, result: newResult });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      updates.updatedAt = new Date();

      await collection.updateOne({ id: parseInt(id) }, { $set: updates });
      const updated = await collection.findOne({ id: parseInt(id) });
      return res.status(200).json({ success: true, result: updated });
    }

    if (req.method === 'DELETE') {
      const id = parseInt(req.query.id);
      const result = await collection.findOne({ id });
      await collection.deleteOne({ id });

      if (result) {
        await fixtures.updateOne(
          { homePlayerId: result.homePlayerId, awayPlayerId: result.awayPlayerId },
          { $set: { played: false, updatedAt: new Date() } }
        );
      }

      return res.status(200).json({ success: true, message: `Result ${id} deleted` });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });

  } catch (err) {
    console.error('❌ Results API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
