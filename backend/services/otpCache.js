// backend/services/otpCache.js
/** Simple in-memory OTP cache */
const otpMap = new Map();

export const get = (email) => otpMap.get(email);

export const set = (email, { otp, expiresAt, attempts }) => {
  otpMap.set(email, { otp, expiresAt, attempts });
};

export const incrementAttempts = (email) => {
  const entry = otpMap.get(email);
  if (entry) {
    entry.attempts += 1;
    otpMap.set(email, entry);
  }
};

export const clear = (email) => otpMap.delete(email);
