'use strict';

const validator = require('validator');
const xss = require('xss');

/**
 * Validation rules for the contact form.
 * Runs synchronously — no async needed.
 */
const RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\p{M} '\-,.]+$/u, // letters, accents, spaces, hyphens, apostrophes
  },
  subject: {
    minLength: 3,
    maxLength: 150,
  },
  message: {
    minLength: 10,
    maxLength: 5000,
  },
};

/**
 * Sanitizes a string value:
 *  - Trims whitespace
 *  - Strips XSS vectors (HTML/script tags, event handlers)
 *  - Normalises internal whitespace
 */
function sanitize(value) {
  if (typeof value !== 'string') return '';
  return xss(value.trim()).replace(/\s+/g, ' ');
}

/**
 * Express middleware.
 * Validates and sanitizes: name, email, subject, message.
 * Returns 422 with a structured errors array on failure.
 */
function validateContact(req, res, next) {
  const errors = [];

  // ── name ──────────────────────────────────────────────
  const name = sanitize(req.body?.name);
  if (!name) {
    errors.push({ field: 'name', message: 'Name is required.' });
  } else if (name.length < RULES.name.minLength) {
    errors.push({ field: 'name', message: `Name must be at least ${RULES.name.minLength} characters.` });
  } else if (name.length > RULES.name.maxLength) {
    errors.push({ field: 'name', message: `Name must not exceed ${RULES.name.maxLength} characters.` });
  } else if (!RULES.name.pattern.test(name)) {
    errors.push({ field: 'name', message: 'Name contains invalid characters.' });
  }

  // ── email ─────────────────────────────────────────────
  const email = sanitize(req.body?.email);
  if (!email) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });
  }

  // ── subject ───────────────────────────────────────────
  const subject = sanitize(req.body?.subject);
  if (!subject) {
    errors.push({ field: 'subject', message: 'Subject is required.' });
  } else if (subject.length < RULES.subject.minLength) {
    errors.push({ field: 'subject', message: `Subject must be at least ${RULES.subject.minLength} characters.` });
  } else if (subject.length > RULES.subject.maxLength) {
    errors.push({ field: 'subject', message: `Subject must not exceed ${RULES.subject.maxLength} characters.` });
  }

  // ── message ───────────────────────────────────────────
  const message = sanitize(req.body?.message);
  if (!message) {
    errors.push({ field: 'message', message: 'Message is required.' });
  } else if (message.length < RULES.message.minLength) {
    errors.push({ field: 'message', message: `Message must be at least ${RULES.message.minLength} characters.` });
  } else if (message.length > RULES.message.maxLength) {
    errors.push({ field: 'message', message: `Message must not exceed ${RULES.message.maxLength} characters.` });
  }

  // ── Result ────────────────────────────────────────────
  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      errors,
    });
  }

  // Attach sanitized data for the controller
  req.contactData = { name, email, subject, message };
  next();
}

module.exports = { validateContact };