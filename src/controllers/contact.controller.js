'use strict';

const { sendContactEmail } = require('../services/email.service');

/**
 * POST /api/contact
 *
 * Expects req.contactData to be set by the validateContact middleware.
 * Sends notification + auto-reply emails concurrently.
 */
exports.sendContact = async (req, res) => {
  try {
    const result = await sendContactEmail(req.contactData);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent. Check your inbox for a confirmation!',
      ...(result.notification.preview && {
        _dev: {
          notificationPreview: result.notification.preview,
          autoReplyPreview: result.autoReply.preview,
        },
      }),
    });

  } catch (err) {
    console.error('[contact.controller] sendContact error:', err);

    // Don't leak internal SMTP details to the client
    res.status(500).json({
      success: false,
      error: 'Failed to send your message. Please try again later.',
    });
  }
};