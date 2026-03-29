const express = require('express');
const productionController = require('./production.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

// router.use(authMiddleware);

// Production entries
router.post('/', productionController.createEntry);

// Endpoint from postman collection
router.post('/submissions', productionController.submitStageEntry);
router.get('/pipeline', productionController.getPipeline);

// create endpoint for shifts
router.get('/shifts', productionController.getShifts);

// list stages
router.get('/', productionController.getStages);

// fetch stats
router.get('/stats', productionController.getStats);

// fetch log details
router.get('/logs', productionController.getLogDetails);

module.exports = router;
