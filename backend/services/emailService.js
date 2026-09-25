// backend/services/emailService.js
import nodemailer from 'nodemailer';
import { get as getOtp, set as setOtp } from './otpCache.js';

import generateOTP from '../utils/generateOTP.js';

/**
 * Send an OTP email based on the requested type.
 * @param {string} email - Recipient email address.
 * @param {'registration'|'resend'|'password'} type - Reason for sending OTP.
 * @param {string} [providedOtp] - OTP already saved on the user record.
 */
export const sendOTPEmail = async (email, type = 'registration', providedOtp) => {
  const isSmtpConfigured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_HOST;

  const now = Date.now();
  const otp = providedOtp || generateOTP();
  const cached = getOtp(email);

  setOtp(email, {
    otp,
    expiresAt: now + 30 * 1000,
    attempts: cached?.attempts || 0,
  });

  if (!isSmtpConfigured) {
    console.log('\n==================================================');
    console.log('[SMTP OFFLINE - DEVELOPER TEST MODE]');
    console.log(`OTP Verification code for: ${email}`);
    console.log(`CODE: ${otp}`);
    console.log('Expires in: 30 seconds');
    console.log('==================================================\\n');
    return { success: true, mode: 'console', otpSent: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subjectMap = {
      registration: 'Verify Your Email - AI Interview Copilot',
      resend: 'Your OTP (Resend) - AI Interview Copilot',
      password: 'Reset Your Password - AI Interview Copilot',
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@interviewcopilot.ai',
      to: email,
      subject: subjectMap[type] || subjectMap.registration,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; text-align: center;">AI Interview Copilot</h2>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p>
            ${type === 'registration'
              ? 'Thank you for registering. Please use the following One‑Time Password (OTP) to verify your email.'
              : type === 'password'
                ? 'You requested a password reset. Please use the OTP below to reset your password.'
                : 'Your OTP request has been processed again. Please use the code below to continue.'}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background-color: #f3f4f6; padding: 10px 20px; border-radius: 4px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code is valid for <strong>30 seconds</strong>. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="text-align: center; font-size: 12px; color: #9ca3af;">&copy; 2026 AI Interview Copilot. All rights reserved.</p>
        </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email verification OTP sent to ${email}. Message ID: ${info.messageId}`);
    return { success: true, mode: 'smtp', otpSent: true };
  } catch (error) {
    console.error('SMTP sending error, falling back to console print:', error.message);
    console.log('\n==================================================');
    console.log('[SMTP ERROR - FALLBACK TEST MODE]');
    console.log(`OTP Verification code for: ${email}`);
    console.log(`CODE: ${otp}`);
    console.log('==================================================\\n');
    return { success: true, mode: 'fallback', otpSent: true };
  }
};
