const express = require('express');
const cors = require('cors');
const sendMail = require('./mail/sendMail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration for Local Development ---
const allowedOrigins = [
  'http://localhost:3000' // Your frontend's local development URL
];

const corsOptions = {
  origin: (origin, callback) => {
    // The 'origin' is the URL of the frontend making the request.
    // We check if this origin is in our allowed list.
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // If it is, allow the request.
      callback(null, true);
    } else {
      // If it's not, block the request with a CORS error.
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Some browsers (or services like Vercel) may require this.
  // It explicitly tells the browser that your server is okay with the preflight check.
  optionsSuccessStatus: 200 
};

// --- Middleware ---

// 1. Use the CORS middleware with your specific options.
// This MUST come before your route handlers.
app.use(cors(corsOptions));

// 2. Use the JSON middleware to parse the request body.
app.use(express.json());

// --- API Route ---
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

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`🚀 Email API running at http://localhost:${PORT}`);
});

// If you plan to deploy this to Vercel, you will need this export.
module.exports = app;