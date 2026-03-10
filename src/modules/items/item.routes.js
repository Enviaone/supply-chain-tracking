const express = require('express');
const itemController = require('./item.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

// Items standalone CRUD
router.post('/', requireRole(['ADMIN']), itemController.createItem);
router.put('/:id', requireRole(['ADMIN']), itemController.updateItem);
router.delete('/:id', requireRole(['ADMIN']), itemController.deleteItem);

module.exports = router;
