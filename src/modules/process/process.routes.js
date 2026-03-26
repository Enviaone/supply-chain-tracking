const express = require('express');
const processController = require('./process.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

// router.use(authMiddleware);

// Items standalone CRUD
router.get('/', processController.getProcesses);
router.get('/:id', processController.getProcessById);
router.get('/:processId/stages', processController.getProcessStages);
router.get(
  '/:processId/stages/:stageId',
  processController.getProcessStageById,
);
router.put(
  '/:processId/stages/order',
  processController.updateProcessStagesOrder,
);

module.exports = router;
