import express from 'express';
import paymentController from '../controllers/paymentController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// POST /api/payflow/stk-push
router.post('/stk-push', authMiddleware, paymentController.initiatePayment);

// POST /api/payflow/status
router.post('/status', authMiddleware, paymentController.checkStatus);

// POST /api/payflow/webhook (no auth required - PayFlow callback)
router.post('/webhook', paymentController.webhook);

// GET /api/receipt/:id
router.get('/receipt/:id', authMiddleware, paymentController.getReceipt);

export default router;
