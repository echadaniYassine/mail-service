const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const contactRoutes = require('../routes/contact.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', contactRoutes);

// 404 (FIXED for Express 5)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;