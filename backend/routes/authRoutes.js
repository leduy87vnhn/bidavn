const express = require('express');
const { registerUser, confirmRegistration, loginUser } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.get('/confirm/:token', confirmRegistration);
router.post('/login', loginUser);


module.exports = router;
