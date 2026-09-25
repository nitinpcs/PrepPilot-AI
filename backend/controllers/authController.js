import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendOTPEmail } from '../services/emailService.js';
import generateOTP from '../utils/generateOTP.js';
import { OTP_VALIDITY_MS } from '../constants/otp.js';
import {
  ApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../errors/ApiError.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '3d';
const REFRESH_COOKIE_MAX_AGE = 3 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET;

const generateAccessToken = (id) =>
  jwt.sign({ id }, getAccessSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, getRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });

const generatePasswordResetToken = (id) =>
  jwt.sign({ id, purpose: 'password_reset' }, getAccessSecret(), { expiresIn: '15m' });

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

/**
 * Extract the refresh token string from the request cookie header.
 * Returns undefined if not present.
 */
const extractRefreshToken = (req) => {
  const cookies = req.headers.cookie;
  if (!cookies) return undefined;
  const match = cookies.split(';').find((c) => c.trim().startsWith('refreshToken='));
  return match ? match.split('=')[1] : undefined;
};

/**
 * Generate both tokens, hash and persist the refresh token, set the cookie.
 * Returns { accessToken, user } for the response body.
 */
const issueAuthTokens = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store only the hash — plain token is sent via httpOnly cookie, never persisted
  user.refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  return {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const saveUserOtp = async (user, purpose) => {
  const otp = generateOTP();
  const otpExpiresAt = Date.now() + OTP_VALIDITY_MS;
  user.otp = otp;
  user.otpExpires = otpExpiresAt;
  user.otpPurpose = purpose;
  await user.save();
  return { otp, otpExpiresAt };
};

// ─── Auth handlers ────────────────────────────────────────────────────────────

// @desc    Register a new user & send OTP
// @route   POST /api/auth/users
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        throw new ApiError(400, 'User already exists and is verified');
      }
      user.name = name;
      user.password = password;
    } else {
      user = new User({ name, email, password });
    }

    const { otp, otpExpiresAt } = await saveUserOtp(user, 'registration');
    const emailResult = await sendOTPEmail(email, 'registration', otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email. Please verify within 30 seconds.',
      email,
      otpExpiresAt,
      developerMode: emailResult.mode === 'console' || emailResult.mode === 'fallback',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email using OTP (registration)
// @route   POST /api/auth/users/verify
// @access  Public
export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) throw new NotFoundError('User not found');

    if (user.isVerified) {
      throw new ApiError(400, 'User is already verified');
    }

    if (user.otpPurpose && user.otpPurpose !== 'registration') {
      throw new ApiError(400, 'Invalid OTP for email verification');
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpPurpose = undefined;

    const authData = await issueAuthTokens(user, res);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      ...authData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP for registration or password reset
// @route   POST /api/auth/otps
// @access  Public
export const resendOtp = async (req, res, next) => {
  const { email, purpose = 'registration' } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) throw new NotFoundError('User not found');

    if (purpose === 'registration' && user.isVerified) {
      throw new ApiError(400, 'User is already verified');
    }

    const { otp, otpExpiresAt } = await saveUserOtp(user, purpose);
    const emailType = purpose === 'password_reset' ? 'password' : 'resend';
    const emailResult = await sendOTPEmail(email, emailType, otp);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully. Please verify within 30 seconds.',
      email,
      purpose,
      otpExpiresAt,
      developerMode: emailResult.mode === 'console' || emailResult.mode === 'fallback',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/passwords/reset-request
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) throw new NotFoundError('User not found');

    if (!user.isVerified) {
      throw new ApiError(400, 'Please verify your email before resetting your password', [], {
        needsVerification: true,
        email: user.email,
      });
    }

    const { otp, otpExpiresAt } = await saveUserOtp(user, 'password_reset');
    const emailResult = await sendOTPEmail(email, 'password', otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email. Please verify within 30 seconds.',
      email,
      otpExpiresAt,
      developerMode: emailResult.mode === 'console' || emailResult.mode === 'fallback',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify password reset OTP and issue reset token
// @route   POST /api/auth/passwords/reset-otp/verify
// @access  Public
export const verifyResetOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) throw new NotFoundError('User not found');

    if (user.otpPurpose !== 'password_reset') {
      throw new ApiError(400, 'No active password reset request found');
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpPurpose = undefined;
    await user.save();

    const resetToken = generatePasswordResetToken(user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
      resetToken,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using verified reset token
// @route   PUT /api/auth/passwords
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, getAccessSecret());

    if (decoded.purpose !== 'password_reset') {
      throw new ApiError(400, 'Invalid reset token');
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new NotFoundError('User not found');

    user.password = newPassword;
    user.refreshTokenHash = undefined;
    await user.save();

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get tokens
// @route   POST /api/auth/sessions
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      throw new ApiError(400, 'Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ApiError(
        403,
        'Please verify your email before logging in',
        [],
        { needsVerification: true, email: user.email },
      );
    }

    const authData = await issueAuthTokens(user, res);

    res.status(200).json({
      success: true,
      ...authData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/sessions/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) throw new UnauthorizedError('Refresh token not found');

    const decoded = jwt.verify(refreshToken, getRefreshSecret());
    const user = await User.findById(decoded.id);

    if (!user || !(await user.matchRefreshToken(refreshToken))) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear tokens
// @route   DELETE /api/auth/sessions
// @access  Public
export const logout = async (req, res, next) => {
  try {
    const refreshToken = extractRefreshToken(req);

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, getRefreshSecret());
        const user = await User.findById(decoded.id);
        if (user && (await user.matchRefreshToken(refreshToken))) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      } catch {
        // Ignore errors during logout token cleanup — session is cleared regardless
      }
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/users/me
// @access  Private
export const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
