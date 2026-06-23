'use strict';

const app = require('./app');
const { port } = require('../config/env');

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`   Health check: http://localhost:${port}/api/health`);
});