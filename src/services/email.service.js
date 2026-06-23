'use strict';

const nodemailer = require('nodemailer');
const { getTransporter } = require('../config/mailer');
const { email: emailConfig, isProduction } = require('../config/env');
const { notificationTemplate, autoReplyTemplate } = require('../templates/emailTemplates');

/**
 * Sends two emails concurrently:
 *  1. Notification to site owner  (always goes to RECIPIENT_EMAIL)
 *  2. Auto-reply to the sender    (goes to the person who filled the form)
 *
 * @param {object} data  Validated + sanitized form payload
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.subject
 * @param {string} data.message
 * @returns {Promise<{ notification: object, autoReply: object }>}
 */
async function sendContactEmail(data) {
  const { name, email, subject, message } = data;
  const transport = await getTransporter();

  const notificationMail = {
    from: `"Portfolio Contact" <${emailConfig.user}>`,
    to: emailConfig.recipient,
    replyTo: `"${name}" <${email}>`,
    subject: `[Portfolio] ${subject}`,
    text: buildPlainText({ name, email, subject, message }),
    html: notificationTemplate({ name, email, subject, message }),
  };

  const autoReplyMail = {
    from: `"Yassine Chadani" <${emailConfig.user}>`,
    to: `"${name}" <${email}>`,
    subject: `Re: ${subject} — I got your message!`,
    text: buildAutoReplyPlain({ name, subject }),
    html: autoReplyTemplate({ name, subject }),
  };

  const [notification, autoReply] = await Promise.all([
    transport.sendMail(notificationMail),
    transport.sendMail(autoReplyMail),
  ]);

  // In dev, log Ethereal preview URLs
  if (!isProduction) {
    console.log('📩 Notification preview:', nodemailer.getTestMessageUrl(notification));
    console.log('↩️  Auto-reply preview: ', nodemailer.getTestMessageUrl(autoReply));
  }

  return {
    notification: {
      messageId: notification.messageId,
      ...(!isProduction && { preview: nodemailer.getTestMessageUrl(notification) }),
    },
    autoReply: {
      messageId: autoReply.messageId,
      ...(!isProduction && { preview: nodemailer.getTestMessageUrl(autoReply) }),
    },
  };
}

// ---------------------------------------------------------------------------
// Plain-text fallbacks (important for spam scoring + accessibility)
// ---------------------------------------------------------------------------
function buildPlainText({ name, email, subject, message }) {
  return [
    `New contact form submission`,
    `─`.repeat(40),
    `From:    ${name} <${email}>`,
    `Subject: ${subject}`,
    ``,
    `Message:`,
    message,
    ``,
    `─`.repeat(40),
    `Sent via your portfolio contact form.`,
  ].join('\n');
}

function buildAutoReplyPlain({ name, subject }) {
  return [
    `Hi ${name},`,
    ``,
    `Thanks for reaching out! I received your message about "${subject}".`,
    `I'll get back to you within 24–48 hours.`,
    ``,
    `Best,`,
    `Yassine Chadani`,
  ].join('\n');
}

module.exports = { sendContactEmail };