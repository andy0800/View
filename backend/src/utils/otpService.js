// backend/src/utils/otpService.js
'use strict';

const { OtpCode } = require('../models');

 /**
  * generateOtp(phone)
  * - Destroys any existing OTPs for this phone
  * - Creates a new 6-digit code that expires in 5 minutes
  */
async function generateOtp(phone) {
  // 1) Purge old codes
  await OtpCode.destroy({ where: { phone } });

  // 2) Build new code + expiration
  const code      = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60_000); // 5m from now

  // 3) Persist
  await OtpCode.create({ phone, code, expiresAt });

  // 4) (Optional) Hook in real SMS provider here
  console.log(`OTP for ${phone}: ${code}`);

  return code;
}

/**
 * verifyOtp(phone, code)
 * - Returns true if a matching, unexpired OTP exists
 * - Deletes it after verification
 */
async function verifyOtp(phone, code) {
  const entry = await OtpCode.findOne({ where: { phone, code } });
  if (!entry) return false;

  if (entry.expiresAt < new Date()) {
    await entry.destroy();
    return false;
  }

  // Good code—consume it
  await entry.destroy();
  return true;
}

module.exports = { generateOtp, verifyOtp };