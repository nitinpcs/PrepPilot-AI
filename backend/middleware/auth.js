import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { UnauthorizedError, ForbiddenError } from '../errors/ApiError.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
      throw new UnauthorizedError('Not authorized, no token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_123!@#');

    req.user = await User.findById(decoded.id).select('-password -otp -otpExpires -refreshTokenHash');

    if (!req.user) {
      throw new UnauthorizedError('Not authorized, user not found');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ForbiddenError('Not authorized as an admin'));
  }
};
