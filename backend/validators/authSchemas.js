import { z } from 'zod';

// ─── Shared field definitions ────────────────────────────────────────────────

const emailField = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email address')
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters');

const otpField = z
  .string({ required_error: 'OTP is required' })
  .min(1, 'OTP is required');

// ─── Auth schemas ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/users
 * Register a new user & send OTP
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    email: emailField,
    password: passwordField,
  }),
});

/**
 * POST /api/auth/users/verify
 * Verify email using OTP (registration)
 */
export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailField,
    otp: otpField,
  }),
});

/**
 * POST /api/auth/otps
 * Resend OTP for registration or password reset
 */
export const resendOtpSchema = z.object({
  body: z.object({
    email: emailField,
    purpose: z
      .enum(['registration', 'password_reset'], {
        errorMap: () => ({ message: "Purpose must be 'registration' or 'password_reset'" }),
      })
      .default('registration'),
  }),
});

/**
 * POST /api/auth/passwords/reset-request
 * Request a password reset OTP
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

/**
 * POST /api/auth/passwords/reset-otp/verify
 * Verify password reset OTP
 */
export const verifyResetOtpSchema = z.object({
  body: z.object({
    email: emailField,
    otp: otpField,
  }),
});

/**
 * PUT /api/auth/passwords
 * Reset password using verified reset token
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z
      .string({ required_error: 'Reset token is required' })
      .min(1, 'Reset token is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
  }),
});

/**
 * POST /api/auth/sessions
 * Login user & get tokens
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});
