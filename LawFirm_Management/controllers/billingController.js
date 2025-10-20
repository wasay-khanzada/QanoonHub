const Billing = require('../models/billing');
const User = require('../models/user');
const Case = require('../models/case');
const getUserInfo = require('../helpers/getUserInfo');
const { DataNotExistError, UnauthorizedAccessError } = require('../helpers/exceptions');
const mongoose = require('mongoose');

// Get invoices based on user role
const getInvoices = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const { status, date, search, caseId } = req.query;

    let query = {};

    // Role-based filtering
    switch (type) {
      case 'client':
        query.clientId = userId;
        break;
      case 'lawyer':
        query.lawyerId = userId;
        break;
      case 'admin':
        // Admin can see all invoices
        break;
      default:
        return res.status(403).json({
          error: 'Unauthorized access'
        });
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.issuedDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (caseId) {
      query.caseId = caseId;
    }

    // Build search query
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { notes: searchRegex }
      ];
    }

    const invoices = await Billing.find(query)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type')
      .populate('createdBy', 'username')
      .sort({ issuedDate: -1 });

    res.status(200).json({
      success: true,
      data: invoices,
      count: invoices.length
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      message: error.message
    });
  }
};

// Get single invoice
const getInvoice = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const { id } = req.params;

    const invoice = await Billing.findById(id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type')
      .populate('createdBy', 'username');

    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }

    // Role-based access control
    if (type === 'client' && invoice.clientId._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    if (type === 'lawyer' && invoice.lawyerId._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      message: error.message
    });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const {
      caseId,
      lawyerId,
      clientId,
      amount,
      dueDate,
      paymentMethod,
      notes
    } = req.body;

    // Validation
    if (!caseId || !lawyerId || !clientId || !amount || !dueDate) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Check if case exists
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(400).json({
        error: 'Invalid case ID'
      });
    }

    // Check if lawyer exists
    const lawyer = await User.findById(lawyerId);
    if (!lawyer || lawyer.type !== 'lawyer') {
      return res.status(400).json({
        error: 'Invalid lawyer ID'
      });
    }

    // Check if client exists
    const client = await User.findById(clientId);
    if (!client || client.type !== 'client') {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    // Check if due date is in the future
    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      return res.status(400).json({
        error: 'Due date must be in the future'
      });
    }

    const invoice = new Billing({
      caseId,
      lawyerId,
      clientId,
      amount,
      dueDate: dueDateObj,
      paymentMethod,
      notes,
      createdBy: userId
    });

    // Generate invoice number if not set by middleware
    if (!invoice.invoiceNumber) {
      const count = await Billing.countDocuments();
      const year = new Date().getFullYear();
      invoice.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    await invoice.save();

    const populatedInvoice = await Billing.findById(invoice._id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type')
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      message: error.message
    });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const { id } = req.params;
    const {
      amount,
      dueDate,
      status,
      paymentMethod,
      notes
    } = req.body;

    const invoice = await Billing.findById(id);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }

    // Role-based access control
    if (type === 'client') {
      return res.status(403).json({
        error: 'Clients cannot update invoices'
      });
    }

    if (type === 'lawyer' && invoice.lawyerId.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    // Update fields
    if (amount !== undefined) invoice.amount = amount;
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (status !== undefined) invoice.status = status;
    if (paymentMethod !== undefined) invoice.paymentMethod = paymentMethod;
    if (notes !== undefined) invoice.notes = notes;

    await invoice.save();

    const updatedInvoice = await Billing.findById(id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type')
      .populate('createdBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      error: 'Failed to update invoice',
      message: error.message
    });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const { id } = req.params;

    const invoice = await Billing.findById(id);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }

    // Only admins can delete invoices
    if (type !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can delete invoices'
      });
    }

    await Billing.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      error: 'Failed to delete invoice',
      message: error.message
    });
  }
};

// Mark invoice as paid
const markAsPaid = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const invoice = await Billing.findById(id);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      });
    }

    // Role-based access control
    if (type === 'client' && invoice.clientId.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    if (type === 'lawyer' && invoice.lawyerId.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    invoice.status = 'Paid';
    if (paymentMethod) {
      invoice.paymentMethod = paymentMethod;
    }

    await invoice.save();

    const updatedInvoice = await Billing.findById(id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type')
      .populate('createdBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({
      error: 'Failed to mark invoice as paid',
      message: error.message
    });
  }
};

// Get billing statistics
const getBillingStats = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);

    let query = {};

    // Role-based filtering
    switch (type) {
      case 'client':
        query.clientId = new mongoose.Types.ObjectId(userId);
        break;
      case 'lawyer':
        query.lawyerId = new mongoose.Types.ObjectId(userId);
        break;
      case 'admin':
        // Admin can see all statistics
        break;
      default:
        return res.status(403).json({
          error: 'Unauthorized access'
        });
    }

    const stats = await Billing.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0]
            }
          },
          unpaidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Unpaid'] }, '$amount', 0]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Overdue'] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    const statusCounts = await Billing.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalInvoices: stats[0]?.totalInvoices || 0,
      totalAmount: stats[0]?.totalAmount || 0,
      paidAmount: stats[0]?.paidAmount || 0,
      unpaidAmount: stats[0]?.unpaidAmount || 0,
      overdueAmount: stats[0]?.overdueAmount || 0,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      error: 'Failed to fetch billing statistics',
      message: error.message
    });
  }
};

// Get available cases for invoice creation
const getAvailableCases = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);

    let query = {};

    // Role-based filtering
    switch (type) {
      case 'lawyer':
        // Find cases where the lawyer is assigned or is a member
        query.$or = [
          { assigned_lawyer_id: userId },
          { "case_member_list.case_member_id": userId, "case_member_list.case_member_type": "lawyer" }
        ];
        break;
      case 'admin':
        // Admin can see all cases
        break;
      default:
        return res.status(403).json({
          error: 'Unauthorized access'
        });
    }

    const cases = await Case.find(query)
      .populate('client_id', 'username email')
      .populate('assigned_lawyer_id', 'username email')
      .select('case_title case_type client_id assigned_lawyer_id case_status');

    res.status(200).json({
      success: true,
      data: cases
    });

  } catch (error) {
    console.error('Error fetching available cases:', error);
    res.status(500).json({
      error: 'Failed to fetch available cases',
      message: error.message
    });
  }
};

// Update overdue invoices (cron job or manual trigger)
const updateOverdueInvoices = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);

    // Only admins can trigger this
    if (type !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can update overdue invoices'
      });
    }

    const updatedCount = await Billing.updateOverdueInvoices();

    res.status(200).json({
      success: true,
      message: `${updatedCount} invoices marked as overdue`,
      updatedCount
    });

  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    res.status(500).json({
      error: 'Failed to update overdue invoices',
      message: error.message
    });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  getBillingStats,
  getAvailableCases,
  updateOverdueInvoices
}; 