const express = require('express');
const locationController = require('./location.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireRole(['ADMIN']), locationController.createLocation);
router.get('/', locationController.getLocations);
router.put('/:id', requireRole(['ADMIN']), locationController.updateLocation);
router.delete('/:id', requireRole(['ADMIN']), locationController.deleteLocation);

module.exports = router;
