const express = require('express');
const brandController = require('./brand.controller');
const itemController = require('../items/item.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

// router.use(authMiddleware);

// Brands CRUD
router.post('/', brandController.createBrand);
router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);
router.put('/:id', requireRole(['ADMIN']), brandController.updateBrand);
router.delete('/:id', requireRole(['ADMIN']), brandController.deleteBrand);

router.get('/:brandId/items', itemController.getItemsByBrand);
router.get('/:brandId/items/:stageKey', itemController.getItemsByBrandAndStage);

module.exports = router;
