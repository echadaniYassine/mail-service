'use strict';

require('dotenv').config();

const required = ['EMAIL_USER', 'EMAIL_PASS', 'RECIPIENT_EMAIL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Parse multiple FRONTEND_URLs separated by " + "
const rawFrontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const allowedOrigins = rawFrontendUrl
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

module.exports = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    recipient: process.env.RECIPIENT_EMAIL,
  },

  cors: {
    allowedOrigins,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // max 5 contact submissions per window
  },
};