const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// CRUD + search
router.get('/', userController.getAllUsers); // with optional ?search=...
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;