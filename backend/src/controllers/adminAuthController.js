import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

const adminAuthController = {
  // POST /api/admin/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return errorResponse(res, 'Email and password are required', 400);
      }

      // Find admin by email
      const result = await db.query(
        'SELECT * FROM admin_auth WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Invalid email or password', 401);
      }

      const admin = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return errorResponse(res, 'Invalid email or password', 401);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          role: 'admin' 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return success with token
      successResponse(res, 'Login successful', {
        token,
        admin: {
          id: admin.id,
          email: admin.email
        }
      });

    } catch (error) {
      console.error('❌ Admin login error:', error);
      errorResponse(res, 'Login failed', 500);
    }
  },

  // GET /api/admin/verify - Verify admin token
  verify: async (req, res) => {
    try {
      // If we got here, the middleware already verified the token
      successResponse(res, 'Token is valid', {
        admin: req.admin
      });
    } catch (error) {
      console.error('❌ Admin verify error:', error);
      errorResponse(res, 'Token verification failed', 500);
    }
  }
};

export default adminAuthController;
