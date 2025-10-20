const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  getBillingStats,
  getAvailableCases,
  updateOverdueInvoices
} = require('../controllers/billingController');

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get invoices (with filters)
router.get('/', getInvoices);

// Get single invoice
router.get('/:id', getInvoice);

// Create new invoice
router.post('/', createInvoice);

// Update invoice
router.put('/:id', updateInvoice);

// Delete invoice
router.delete('/:id', deleteInvoice);

// Mark invoice as paid
router.patch('/:id/paid', markAsPaid);

// Get billing statistics
router.get('/stats/overview', getBillingStats);

// Get available cases for invoice creation
router.get('/cases/available', getAvailableCases);

// Update overdue invoices (admin only)
router.patch('/update-overdue', updateOverdueInvoices);

module.exports = router; 