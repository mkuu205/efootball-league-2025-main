const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('efootball-league');
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();

    // GET - Get all results
    if (req.method === 'GET') {
      const results = await db.collection('results').find().sort({ date: -1 }).toArray();
      return res.status(200).json({ success: true, results });
    }

    // POST - Create new result
    if (req.method === 'POST') {
      const newResult = req.body;
      
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
      
      return res.status(201).json({ success: true, result: newResult });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Results API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
