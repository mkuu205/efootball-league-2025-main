import express from 'express';
import authController from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { body } from 'express-validator';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 100 }).withMessage('Username must be 3-100 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/check-username
router.post('/check-username', authController.checkUsername);

export default router;
