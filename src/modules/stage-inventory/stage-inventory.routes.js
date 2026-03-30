const express = require('express');
const StageInventoryController = require('./stage-inventory.controller');
const router = express.Router();

router.get('/tracking', StageInventoryController.getStageTracking);
router.get('/available', StageInventoryController.getAvailableAtStage);

module.exports = router;
