const { sendEmail } = require('../services/email.service');

exports.sendContact = async (req, res) => {
  try {
    const result = await sendEmail(req.body);

    res.json({
      success: true,
      message: 'Email sent',
      result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};