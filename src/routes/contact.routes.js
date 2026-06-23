'use strict';

const router = require('express').Router();
const { sendContact } = require('../controllers/contact.controller');
const { validateContact } = require('../middlewares/validateContact');
const { contactRateLimit } = require('../middlewares/rateLimit');

// POST /api/contact
// Order: rate limit → validate/sanitize → send
router.post('/contact', contactRateLimit, validateContact, sendContact);

module.exports = router;