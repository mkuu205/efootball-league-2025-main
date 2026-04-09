import express from 'express';
import tournamentController from '../controllers/tournamentController.js';
import authMiddleware from '../middleware/auth.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const router = express.Router();

// POST /api/tournaments/create (admin only - uses admin JWT)
router.post('/create', adminAuthMiddleware, tournamentController.createTournament);

// GET /api/tournaments
router.get('/', tournamentController.getTournaments);

// GET /api/tournaments/:id
router.get('/:id', tournamentController.getTournament);

// POST /api/tournaments/:id/join
router.post('/:id/join', authMiddleware, tournamentController.joinTournament);

export default router;
