import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, errors.array());
  }
  
  next();
};

export default validate;
