'use strict';

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/env');

/**
 * Contact form rate limiter.
 * Allows 5 submissions per IP per 15 minutes.
 * Returns JSON (not HTML) so the frontend can parse it cleanly.
 */
const contactRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: 'draft-7', // RateLimit headers (RFC 6585 draft 7)
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // ipKeyGenerator handles both IPv4 and IPv6 safely
  keyGenerator: ipKeyGenerator,

  handler(req, res) {
    const retryAfterSec = Math.ceil(rateLimitConfig.windowMs / 1000);
    res.status(429).json({
      success: false,
      error: 'Too many requests — please wait a moment before trying again.',
      retryAfter: retryAfterSec,
    });
  },
});

/**
 * Global API rate limiter (broader window, higher ceiling).
 * Guards all /api/* routes against general abuse.
 */
const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests / minute / IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,

  handler(req, res) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please slow down.',
    });
  },
});

module.exports = { contactRateLimit, globalRateLimit };