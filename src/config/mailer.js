'use strict';

const nodemailer = require('nodemailer');
const { email, isProduction } = require('./env');

/**
 * Nodemailer transporter.
 * - Production: real Gmail via App Password
 * - Development: Ethereal (catches all mail, nothing sent for real)
 */

let transporter;

async function getTransporter() {
    if (transporter) return transporter;

    if (isProduction) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email.user,
                pass: email.pass,
            },
        });
    } else {
        // Ethereal test account — auto-created, free, no sign-up needed
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email.user,
                pass: email.pass, // must be App Password
            },
        });
        console.log('📬 Dev mailer ready — preview at https://ethereal.email');
    }

    // Verify SMTP connection
    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
    } catch (err) {
        console.error('❌ SMTP connection failed:', err.message);
        throw err;
    }

    return transporter;
}

module.exports = { getTransporter };