const Appointment = require('../models/appointment');
const User = require('../models/user');
const Case = require('../models/case');
const getUserInfo = require('../helpers/getUserInfo');
const { DataNotExistError, UnauthorizedAccessError } = require('../helpers/exceptions');

// Get appointments based on user role
const getAppointments = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const { status, date, search } = req.query;

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
        // Admin can see all appointments
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
      query.dateTime = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Build search query
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { notes: searchRegex }
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type')
      .sort({ dateTime: 1 });

    res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      error: 'Failed to fetch appointments',
      message: error.message
    });
  }
};

// Get single appointment
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type } = getUserInfo(res);

    const appointment = await Appointment.findById(id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type');

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check access permissions
    if (type === 'client' && appointment.clientId._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    if (type === 'lawyer' && appointment.lawyerId._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      error: 'Failed to fetch appointment',
      message: error.message
    });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    const { userId, type } = getUserInfo(res);
    const {
      clientId,
      lawyerId,
      caseId,
      dateTime,
      meetingMode,
      meetingLink,
      notes
    } = req.body;

    // Validation
    if (!clientId || !lawyerId || !caseId || !dateTime || !meetingMode) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Check if client and lawyer exist
    const client = await User.findById(clientId);
    const lawyer = await User.findById(lawyerId);
    const caseDoc = await Case.findById(caseId);

    if (!client || client.type !== 'client') {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    if (!lawyer || lawyer.type !== 'lawyer') {
      return res.status(400).json({
        error: 'Invalid lawyer ID'
      });
    }

    if (!caseDoc) {
      return res.status(400).json({
        error: 'Invalid case ID'
      });
    }

    // Check if appointment time is in the future
    const appointmentDate = new Date(dateTime);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        error: 'Appointment date must be in the future'
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      $or: [
        { clientId, dateTime: { $gte: appointmentDate, $lt: new Date(appointmentDate.getTime() + 60 * 60 * 1000) } },
        { lawyerId, dateTime: { $gte: appointmentDate, $lt: new Date(appointmentDate.getTime() + 60 * 60 * 1000) } }
      ],
      status: { $nin: ['Cancelled', 'Rejected'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        error: 'Time slot is already booked'
      });
    }

    const appointment = new Appointment({
      clientId,
      lawyerId,
      caseId,
      dateTime: appointmentDate,
      meetingMode,
      meetingLink: meetingMode === 'Online' ? meetingLink : null,
      notes,
      createdBy: type === 'admin' ? 'Admin' : 'Client'
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      error: 'Failed to create appointment',
      message: error.message
    });
  }
};

// Update appointment (status, notes, reschedule)
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type } = getUserInfo(res);
    const { status, notes, dateTime, meetingMode, meetingLink } = req.body;

    const appointment = await Appointment.findById(id)
      .populate('clientId', 'username email')
      .populate('lawyerId', 'username email')
      .populate('caseId', 'case_title case_type');

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check permissions
    if (type === 'client') {
      if (appointment.clientId._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access'
        });
      }
      // Clients can only cancel appointments
      if (status && status !== 'Cancelled') {
        return res.status(403).json({
          error: 'Clients can only cancel appointments'
        });
      }
    }

    if (type === 'lawyer') {
      if (appointment.lawyerId._id.toString() !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access'
        });
      }
      // Lawyers can update status and notes
      if (status && !['Accepted', 'Rejected', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status for lawyer'
        });
      }
    }

    // Build update object
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (dateTime) {
      const newDateTime = new Date(dateTime);
      if (newDateTime <= new Date()) {
        return res.status(400).json({
          error: 'Appointment date must be in the future'
        });
      }
      updateData.dateTime = newDateTime;
    }
    if (meetingMode) updateData.meetingMode = meetingMode;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('clientId', 'username email')
     .populate('lawyerId', 'username email')
     .populate('caseId', 'case_title case_type');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      error: 'Failed to update appointment',
      message: error.message
    });
  }
};

// Delete appointment (cancel)
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type } = getUserInfo(res);

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found'
      });
    }

    // Check permissions
    if (type === 'client') {
      if (appointment.clientId.toString() !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access'
        });
      }
    } else if (type === 'lawyer') {
      if (appointment.lawyerId.toString() !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access'
        });
      }
    }
    // Admin can delete any appointment

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      error: 'Failed to delete appointment',
      message: error.message
    });
  }
};

// Get available lawyers for appointment creation
const getAvailableLawyers = async (req, res) => {
  try {
    const { caseId } = req.query;

    let query = { type: 'lawyer', isVerified: true };

    // If caseId is provided, filter lawyers by case type
    if (caseId) {
      const caseDoc = await Case.findById(caseId);
      if (caseDoc) {
        query.specializations = caseDoc.case_type;
      }
    }

    const lawyers = await User.find(query, 'username email specializations rating totalCases');

    res.status(200).json({
      success: true,
      data: lawyers
    });

  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({
      error: 'Failed to fetch lawyers',
      message: error.message
    });
  }
};

// Get client cases for appointment creation
const getClientCases = async (req, res) => {
  try {
    const { userId } = getUserInfo(res);

    const cases = await Case.find({ client_id: userId }, 'case_title case_type case_status');

    res.status(200).json({
      success: true,
      data: cases
    });

  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      error: 'Failed to fetch cases',
      message: error.message
    });
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableLawyers,
  getClientCases
};
