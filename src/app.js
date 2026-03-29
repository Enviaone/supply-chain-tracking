const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Lamina Inventory API MVP' });
});

// Mount Routes
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/users', require('./modules/users/user.routes'));
app.use('/api/v1/brands', require('./modules/brands/brand.routes'));
app.use('/api/v1/items', require('./modules/items/item.routes'));
app.use('/api/v1/process', require('./modules/process/process.routes'));
app.use('/api/v1/locations', require('./modules/locations/location.routes'));
app.use(
  '/api/v1/production',
  require('./modules/production/production.routes'),
);
app.use(
  '/api/v1/inspection',
  require('./modules/inspection/inspection.routes'),
);
app.use('/api/v1/transfers', require('./modules/transfers/transfer.routes'));
// app.use('/api/v1/logs', require('./modules/logs/log.routes'));
app.use('/api/v1/reports', require('./modules/dashboard/dashboard.routes'));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 404,
    message: 'Endpoint not found',
    data: {},
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: err.message || 'Internal Server Error',
    data: {},
  });
});

module.exports = app;
