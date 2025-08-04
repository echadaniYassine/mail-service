const express = require('express');
const cors = require('cors');
const sendMail = require('./sendMail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    await sendMail({ name, email, subject, message });
    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Mail sending error:', error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email API running at http://localhost:${PORT}`);
});
