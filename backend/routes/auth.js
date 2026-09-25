import express from 'express';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import rateLimitOTP from '../middleware/rateLimitOTP.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  loginSchema,
} from '../validators/authSchemas.js';
import {
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  login,
  refresh,
  logout,
  getProfile,
} from '../controllers/authController.js';

const router = express.Router();

// @desc    Register a new user & send OTP
// @route   POST /api/auth/users
// @access  Public
router.post('/users', validate(registerSchema), register);

// @desc    Verify email using OTP (registration)
// @route   POST /api/auth/users/verify
// @access  Public
router.post('/users/verify', validate(verifyOtpSchema), verifyOtp);

// @desc    Create and resend registration/reset OTP
// @route   POST /api/auth/otps
// @access  Public
router.post('/otps', rateLimitOTP, validate(resendOtpSchema), resendOtp);

// @desc    Request a password reset OTP
// @route   POST /api/auth/passwords/reset-request
// @access  Public
router.post('/passwords/reset-request', rateLimitOTP, validate(forgotPasswordSchema), forgotPassword);

// @desc    Verify password reset OTP
// @route   POST /api/auth/passwords/reset-otp/verify
// @access  Public
router.post('/passwords/reset-otp/verify', validate(verifyResetOtpSchema), verifyResetOtp);

// @desc    Reset password using verified reset token
// @route   PUT /api/auth/passwords
// @access  Public
router.put('/passwords', validate(resetPasswordSchema), resetPassword);

// @desc    Login user (create a new session)
// @route   POST /api/auth/sessions
// @access  Public
router.post('/sessions', validate(loginSchema), login);

// @desc    Refresh access token
// @route   POST /api/auth/sessions/refresh
// @access  Public
router.post('/sessions/refresh', refresh);

// @desc    Logout user (delete current session)
// @route   DELETE /api/auth/sessions
// @access  Public
router.delete('/sessions', logout);

// @desc    Get current user profile
// @route   GET /api/auth/users/me
// @access  Private
router.get('/users/me', protect, getProfile);

export default router;
