const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableLawyers,
  getClientCases
} = require('../controllers/appointmentController');

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get appointments (with filters)
router.get('/', getAppointments);

// Get single appointment
router.get('/:id', getAppointment);

// Create new appointment
router.post('/', createAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Delete appointment
router.delete('/:id', deleteAppointment);

// Get available lawyers (for appointment creation)
router.get('/lawyers/available', getAvailableLawyers);

// Get client cases (for appointment creation)
router.get('/cases/client', getClientCases);

module.exports = router;