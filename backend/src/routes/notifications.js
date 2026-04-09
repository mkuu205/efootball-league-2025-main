import express from 'express';
import notificationController from '../controllers/notificationController.js';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/auth.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/notifications
router.get('/', authMiddleware, notificationController.getNotifications);

// POST /api/notifications/:id/read
router.post('/:id/read', authMiddleware, notificationController.markAsRead);

// POST /api/notifications/read-all
router.post('/read-all', authMiddleware, notificationController.markAllAsRead);

// POST /api/admin/notify-all (admin only - uses admin JWT)
router.post('/admin/notify-all', adminAuthMiddleware, adminController.notifyAll);

export default router;
