const express = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = express.Router();

// router.use(authMiddleware);

router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.get('/:id/stages', userController.getUserStages);

// master role
router.get('/roles', userController.getRoles);

// user management
router.get('/stats', userController.getStats);

// Mock login
router.get('/dev/login', userController.mockLogin);

module.exports = router;
