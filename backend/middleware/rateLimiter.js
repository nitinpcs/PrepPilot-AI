// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Default values can be overridden via .env
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100; // max requests per window per IP

const limiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

export default limiter;
