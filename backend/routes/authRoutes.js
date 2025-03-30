const express = require('express');
const { registerUser, confirmRegistration } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.get('/confirm/:token', confirmRegistration);

module.exports = router;
