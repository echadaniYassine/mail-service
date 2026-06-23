'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { cors: corsConfig, isProduction } = require('../config/env');
const { globalRateLimit } = require('../middlewares/rateLimit');
const contactRoutes = require('../routes/contact.routes');

const app = express();

// ── Trust Vercel / reverse-proxy forwarded IPs ──────────────────────────────
// Required for express-rate-limit to work correctly behind Vercel
if (isProduction) {
    app.set('trust proxy', true);
}

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin(origin, callback) {
            // Allow server-to-server requests (no origin) and all allowed origins
            if (!origin || corsConfig.allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`Blocked CORS origin: ${origin}`);
                callback(null, false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
    })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use('/api', globalRateLimit);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api', contactRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[app] Unhandled error:', err.message);
    const status = err.status ?? 500;
    res.status(status).json({
        success: false,
        error: isProduction ? 'An unexpected error occurred.' : err.message,
    });
});

module.exports = app;