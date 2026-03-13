const express = require('express');
const brandController = require('./brand.controller');
const itemController = require('../items/item.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

// Brands CRUD
router.post('/', requireRole(['ADMIN']), brandController.createBrand);
router.get('/', requireRole(['ADMIN']), brandController.getBrands);
router.get('/:id', requireRole(['ADMIN']), brandController.getBrandById);
router.put('/:id', requireRole(['ADMIN']), brandController.updateBrand);
router.delete('/:id', requireRole(['ADMIN']), brandController.deleteBrand);

// Items under brand (as per Postman structure /brands/:brandId/items)
router.get('/:brandId/items', itemController.getItemsByBrand);

module.exports = router;
