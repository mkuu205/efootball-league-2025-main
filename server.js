// server.js - eFootball League 2025
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // optional, if you have static frontend

// MongoDB Setup
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'efl2025';
let db, playersCollection, fixturesCollection, resultsCollection;

async function connectDB() {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    playersCollection = db.collection('players');
    fixturesCollection = db.collection('fixtures');
    resultsCollection = db.collection('results');
    console.log('✅ Connected to MongoDB');
}
connectDB().catch(console.error);

// ===== Health Check =====
app.get('/api/health', async (req, res) => {
    try {
        await db.command({ ping: 1 });
        res.json({ status: 'online' });
    } catch (error) {
        res.status(500).json({ status: 'offline', error: error.message });
    }
});

// ===== Initialize DB (Clear all collections) =====
app.post('/api/initialize', async (req, res) => {
    try {
        await playersCollection.deleteMany({});
        await fixturesCollection.deleteMany({});
        await resultsCollection.deleteMany({});
        res.json({ status: 'ok', message: 'Database initialized' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// ===== Players Routes =====
app.get('/api/players', async (req, res) => {
    const players = await playersCollection.find({}).toArray();
    res.json({ players });
});

app.post('/api/players', async (req, res) => {
    const player = req.body;
    const result = await playersCollection.insertOne(player);
    res.json({ player: { _id: result.insertedId, ...player } });
});

app.put('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const result = await playersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: 'after' }
    );
    res.json({ player: result.value });
});

app.delete('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    await playersCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ status: 'ok' });
});

// ===== Fixtures Routes =====
app.get('/api/fixtures', async (req, res) => {
    const fixtures = await fixturesCollection.find({}).toArray();
    res.json({ fixtures });
});

app.post('/api/fixtures', async (req, res) => {
    const fixture = req.body;
    const result = await fixturesCollection.insertOne(fixture);
    res.json({ fixture: { _id: result.insertedId, ...fixture } });
});

app.put('/api/fixtures/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const result = await fixturesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: 'after' }
    );
    res.json({ fixture: result.value });
});

app.delete('/api/fixtures/:id', async (req, res) => {
    const { id } = req.params;
    await fixturesCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ status: 'ok' });
});

// ===== Results Routes =====
app.get('/api/results', async (req, res) => {
    const results = await resultsCollection.find({}).toArray();
    res.json({ results });
});

app.post('/api/results', async (req, res) => {
    const resultData = req.body;
    const result = await resultsCollection.insertOne(resultData);
    res.json({ result: { _id: result.insertedId, ...resultData } });
});

app.put('/api/results/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const result = await resultsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: 'after' }
    );
    res.json({ result: result.value });
});

app.delete('/api/results/:id', async (req, res) => {
    const { id } = req.params;
    await resultsCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ status: 'ok' });
});

// ===== Start Server =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});
