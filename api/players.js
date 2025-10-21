// api/players.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = process.env.DB_NAME || 'efootball_league';
const collectionName = 'players';

module.exports = async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const players = db.collection(collectionName);

    switch (req.method) {
      // ✅ GET all players
      case 'GET': {
        const allPlayers = await players.find().toArray();
        return res.status(200).json({ success: true, players: allPlayers });
      }

      // ✅ POST new player
      case 'POST': {
        const { name, team, position, goals = 0, assists = 0, points = 0 } = req.body;

        if (!name || !team || !position) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newPlayer = {
          name,
          team,
          position,
          goals: Number(goals),
          assists: Number(assists),
          points: Number(points),
          createdAt: new Date(),
        };

        await players.insertOne(newPlayer);
        return res.status(201).json({ success: true, player: newPlayer });
      }

      // ✅ PUT update existing player
      case 'PUT': {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'Missing player ID' });

        const { ObjectId } = require('mongodb');
        const result = await players.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );

        return res.status(200).json({ success: true, result });
      }

      // ✅ DELETE player
      case 'DELETE': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, message: 'Missing player ID' });

        const { ObjectId } = require('mongodb');
        await players.deleteOne({ _id: new ObjectId(id) });

        return res.status(200).json({ success: true, message: 'Player deleted' });
      }

      // ❌ Invalid method
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Player API error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    await client.close();
  }
};
