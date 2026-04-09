import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';

// Middleware to verify admin JWT token
const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return errorResponse(res, 'Invalid token format', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      return errorResponse(res, 'Admin access required', 403);
    }

    // Attach admin info to request
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

export default adminAuthMiddleware;
