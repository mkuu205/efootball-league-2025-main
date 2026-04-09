import express from 'express';
import adminAuthController from '../controllers/adminAuthController.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const router = express.Router();

// POST /api/admin/login - Public route
router.post('/login', adminAuthController.login);

// GET /api/admin/verify - Protected route
router.get('/verify', adminAuthMiddleware, adminAuthController.verify);

export default router;
