import { errorResponse } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (req.user.role !== ROLES.ADMIN) {
      return errorResponse(res, 'Admin access required', 403);
    }

    next();
  } catch (error) {
    return errorResponse(res, 'Authorization failed', 403);
  }
};

export default adminMiddleware;
