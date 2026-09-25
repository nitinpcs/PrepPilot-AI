// backend/utils/generateOTP.js
/**
 * Generate a 6‑digit numeric OTP as a string.
 */
export default function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
