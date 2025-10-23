const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://efootballadmin:Brashokish2425@efootball-league.xykgya4.mongodb.net/efootball-league?retryWrites=true&w=majority&appName=efootball-league';

const SAMPLE_PLAYERS = [
    { id: 1, name: 'alwaysresistance', team: 'Kenya', photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', strength: 3138, teamColor: '#000000', defaultPhoto: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: 'lildrip035', team: 'Chelsea', photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', strength: 3100, teamColor: '#034694', defaultPhoto: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 3, name: 'Sergent white', team: 'Chelsea', photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', strength: 3042, teamColor: '#034694', defaultPhoto: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 4, name: 'skangaKe254', team: 'Liverpool', photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', strength: 2700, teamColor: '#c8102e', defaultPhoto: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 5, name: 'Drexas', team: 'Everton', photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', strength: 2792, teamColor: '#003399', defaultPhoto: 'https://i.ibb.co/2mzRJVn/drexas.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 6, name: 'Collo leevan', team: 'Manchester United', photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', strength: 2448, teamColor: '#da291c', defaultPhoto: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 7, name: 'captainkenn', team: 'West Ham', photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', strength: 3110, teamColor: '#7c2c3b', defaultPhoto: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', createdAt: new Date(), updatedAt: new Date() },
    { id: 8, name: 'Bora kesho', team: 'Manchester United', photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg', strength: 3177, teamColor: '#DA291C', defaultPhoto: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg', createdAt: new Date(), updatedAt: new Date() }
];

module.exports = async (req, res) => {
  try {
    await client.connect();
    const db = client.db('efootball_league');
    const collection = db.collection('players');

    // Remove existing players
    await collection.deleteMany({});
    // Insert new ones
    await collection.insertMany(SAMPLE_PLAYERS);

    res.json({ success: true, message: 'Database initialized successfully', count: SAMPLE_PLAYERS.length });
  } catch (error) {
    console.error('Error initializing DB:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.close();
  }
};
