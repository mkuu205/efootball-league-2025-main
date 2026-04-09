import express from 'express';
import leagueController from '../controllers/leagueController.js';
import authMiddleware from '../middleware/auth.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/users
router.get('/users', leagueController.getUsers);

// GET /api/standings
router.get('/standings', leagueController.getStandings);

// POST /api/fixtures/generate (admin only - uses admin JWT)
router.post('/fixtures/generate', adminAuthMiddleware, leagueController.generateFixtures);

// GET /api/fixtures
router.get('/fixtures', leagueController.getFixtures);

// POST /api/results/submit
router.post('/results/submit', authMiddleware, leagueController.submitResult);

export default router;
