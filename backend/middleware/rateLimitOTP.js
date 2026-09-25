// backend/middleware/rateLimitOTP.js
/**
 * Middleware to limit OTP request attempts per email.
 * Uses otpCache to track the number of OTPs sent and enforces a max limit.
 */
import { get as getOtp, set as setOtp } from '../services/otpCache.js';
import { OTP_VALIDITY_MS } from '../constants/otp.js';

const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX || '5', 10);

export default function rateLimitOTP(req, res, next) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required for OTP request' });
  }

  const entry = getOtp(email);
  const now = Date.now();

  if (entry && entry.expiresAt && entry.expiresAt > now) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
      });
    }
    setOtp(email, { ...entry, attempts: entry.attempts + 1 });
  } else {
    setOtp(email, { attempts: 1, expiresAt: now + OTP_VALIDITY_MS, otp: undefined });
  }

  next();
}
