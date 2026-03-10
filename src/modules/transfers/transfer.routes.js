const express = require('express');
const transferController = require('./transfer.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/out', transferController.transferOut);
router.post('/in', transferController.receiveTransfer);

module.exports = router;
