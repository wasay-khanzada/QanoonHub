const multer = require('multer')
const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController')
const {requireAuth, requireAdmin} = require('../middlewares/authMiddleware')
const upload = multer({ dest: 'uploads/' })

// Get all users (clients)
router.get('/', requireAuth, crmController.listUser);

// Get all employees
router.get('/employee', requireAuth, crmController.listEmployee);

// Get specific user
router.get('/:id', requireAuth, crmController.listSelectedUser);

// Create user (admin only)
router.post('/', requireAuth, requireAdmin, crmController.createUser);

// Update user (admin only)
router.put('/:id', requireAuth, requireAdmin, crmController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireAuth, requireAdmin, crmController.deleteUser);

// Update password
router.put('/password/:id', requireAuth, crmController.updatePassword);

// Verify lawyer (admin only)
router.put('/verify/:id', requireAuth, requireAdmin, crmController.verifyLawyer);

module.exports = router;