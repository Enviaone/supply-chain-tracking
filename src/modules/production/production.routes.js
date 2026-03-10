const express = require('express');
const productionController = require('./production.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// Endpoint from postman collection
router.post('/submissions', productionController.submitStageEntry);
router.get('/pipeline', productionController.getPipeline); // List Pending Stage Pipeline

module.exports = router;
