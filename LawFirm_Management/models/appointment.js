const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Client ID is required"]
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Lawyer ID is required"]
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, "Case ID is required"]
  },
  dateTime: {
    type: Date,
    required: [true, "Appointment date and time is required"]
  },
  meetingMode: {
    type: String,
    enum: ['Online', 'Offline'],
    required: [true, "Meeting mode is required"]
  },
  meetingLink: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: null
  },
  createdBy: {
    type: String,
    enum: ['Client', 'Admin'],
    required: [true, "Creator type is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
appointmentSchema.index({ clientId: 1, dateTime: 1 });
appointmentSchema.index({ lawyerId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1 });

// Pre-save middleware to update updatedAt
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;  