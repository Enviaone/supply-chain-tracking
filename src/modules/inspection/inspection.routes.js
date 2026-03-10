const express = require('express');
const inspectionController = require('./inspection.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireRole(['ADMIN', 'INSPECTION']), inspectionController.inspectBatch);

module.exports = router;
