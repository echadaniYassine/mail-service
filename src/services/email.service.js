const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async (data) => {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: data.subject,
    text: data.message,
  });
};