const express = require('express');
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/production-summary', dashboardController.getProductionSummary);
router.get('/rejections', dashboardController.getRejectionAnalysis);

module.exports = router;
