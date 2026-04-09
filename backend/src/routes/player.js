import express from 'express';
import playerController from '../controllers/playerController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/player/profile
router.get('/profile', playerController.getProfile);

// GET /api/player/stats
router.get('/stats', playerController.getStats);

// GET /api/player/matches
router.get('/matches', playerController.getMatches);

// GET /api/player/receipts
router.get('/receipts', playerController.getReceipts);

// GET /api/player/tournaments
router.get('/tournaments', playerController.getTournaments);

export default router;
