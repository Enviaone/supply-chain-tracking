const express = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', requireRole(['ADMIN']), userController.createUser);
router.get('/', requireRole(['ADMIN']), userController.getUsers);
router.put('/:id', requireRole(['ADMIN']), userController.updateUser);
router.delete('/:id', requireRole(['ADMIN']), userController.deleteUser);

module.exports = router;
