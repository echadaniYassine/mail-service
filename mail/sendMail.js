const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ name, email, subject, message }) {
  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.RECEIVER_EMAIL,
    subject,
    text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendMail;
