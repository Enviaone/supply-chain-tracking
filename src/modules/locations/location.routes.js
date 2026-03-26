const express = require('express');
const locationController = require('./location.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

// router.use(authMiddleware);

router.post('/', locationController.createLocation);
router.get('/', locationController.getLocations);
router.put('/:id', locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;
