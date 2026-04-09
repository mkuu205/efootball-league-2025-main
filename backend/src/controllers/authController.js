import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response.js';

const authController = {
  // POST /api/auth/register
  register: async (req, res) => {
    try {
      const { username, email, password, team } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return errorResponse(res, 'Username, email, and password are required', 400);
      }

      // Check if username or email already exists
      const existingUser = await db.query(
        'SELECT id FROM player_accounts WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return errorResponse(res, 'Username or email already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const result = await db.query(
        `INSERT INTO player_accounts (username, email, password, team) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, username, email, role, team, rating, created_at`,
        [username, email, hashedPassword, team || null]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      successResponse(res, 'Registration successful', {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          team: user.team,
          rating: user.rating
        }
      }, 201);
    } catch (error) {
      console.error('❌ Registration error:', error);
      errorResponse(res, 'Registration failed', 500);
    }
  },

  // POST /api/auth/login
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return errorResponse(res, 'Email/username and password are required', 400);
      }

      // Find user by email or username
      const result = await db.query(
        'SELECT * FROM player_accounts WHERE email = $1 OR username = $1',
        [identifier]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      // Update last_seen
      await db.query(
        'UPDATE player_accounts SET last_seen = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      successResponse(res, 'Login successful', {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          team: user.team,
          rating: user.rating,
          wins: user.wins,
          losses: user.losses,
          draws: user.draws
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      errorResponse(res, 'Login failed', 500);
    }
  },

  // POST /api/auth/check-username
  checkUsername: async (req, res) => {
    try {
      const { username } = req.body;

      if (!username) {
        return errorResponse(res, 'Username is required', 400);
      }

      const result = await db.query(
        'SELECT id FROM player_accounts WHERE username = $1',
        [username]
      );

      successResponse(res, 'Username check completed', {
        available: result.rows.length === 0
      });
    } catch (error) {
      console.error('❌ Username check error:', error);
      errorResponse(res, 'Username check failed', 500);
    }
  }
};

export default authController;
