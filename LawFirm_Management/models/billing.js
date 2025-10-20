const mongoose = require('mongoose');
const { Schema } = mongoose;

const billingSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: [true, "Invoice number is required"],
    unique: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, "Case ID is required"]
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Lawyer ID is required"]
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Client ID is required"]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"]
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Unpaid'
  },
  issuedDate: {
    type: Date,
    required: [true, "Issued date is required"],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required"]
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Online Payment'],
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Creator ID is required"]
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
billingSchema.index({ clientId: 1, status: 1 });
billingSchema.index({ lawyerId: 1, status: 1 });
billingSchema.index({ caseId: 1 });
billingSchema.index({ dueDate: 1 });
billingSchema.index({ status: 1, dueDate: 1 });

// Pre-save middleware to update updatedAt
billingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate invoice number
billingSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.invoiceNumber) {
      const count = await this.constructor.countDocuments();
      const year = new Date().getFullYear();
      this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if invoice is overdue
billingSchema.methods.isOverdue = function() {
  return this.status === 'Unpaid' && new Date() > this.dueDate;
};

// Static method to update overdue invoices
billingSchema.statics.updateOverdueInvoices = async function() {
  const overdueInvoices = await this.find({
    status: 'Unpaid',
    dueDate: { $lt: new Date() }
  });
  
  for (const invoice of overdueInvoices) {
    invoice.status = 'Overdue';
    await invoice.save();
  }
  
  return overdueInvoices.length;
};

const Billing = mongoose.model('Billing', billingSchema);

module.exports = Billing; 