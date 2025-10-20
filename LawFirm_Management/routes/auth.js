const express = require('express');
const router = express.Router();
const { test, registerUser, loginUser, readUser, me, logout } = require('../controllers/authController')
const { requireAuth } = require('../middlewares/authMiddleware')

router.post('/login', loginUser)
router.post('/register', registerUser)
router.get('/me', requireAuth, me)
router.post('/logout', requireAuth, logout)

module.exports = router;