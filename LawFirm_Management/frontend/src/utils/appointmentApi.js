import axios from 'axios';

// Base API configuration
const API_BASE = '/api/appointments';

// Appointment API functions
export const appointmentApi = {
  // Get appointments with filters
  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(`${API_BASE}?${params}`);
    return response.data;
  },

  // Get single appointment
  getAppointment: async (id) => {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    const response = await axios.post(API_BASE, appointmentData);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id, updateData) => {
    const response = await axios.put(`${API_BASE}/${id}`, updateData);
    return response.data;
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  // Get available lawyers
  getAvailableLawyers: async (caseId = null) => {
    const params = caseId ? `?caseId=${caseId}` : '';
    const response = await axios.get(`${API_BASE}/lawyers/available${params}`);
    return response.data;
  },

  // Get client cases
  getClientCases: async () => {
    const response = await axios.get(`${API_BASE}/cases/client`);
    return response.data;
  }
};

// Helper functions for appointment data
export const appointmentHelpers = {
  // Format date and time
  formatDateTime: (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString(),
      iso: date.toISOString()
    };
  },

  // Get status color
  getStatusColor: (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Accepted': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  },

  // Get meeting mode icon
  getMeetingModeIcon: (mode) => {
    return mode === 'Online' ? 'VideoCameraIcon' : 'MapPinIcon';
  },

  // Validate appointment data
  validateAppointment: (data) => {
    const errors = {};

    if (!data.clientId) errors.clientId = 'Client is required';
    if (!data.lawyerId) errors.lawyerId = 'Lawyer is required';
    if (!data.caseId) errors.caseId = 'Case is required';
    if (!data.dateTime) errors.dateTime = 'Date and time is required';
    if (!data.meetingMode) errors.meetingMode = 'Meeting mode is required';
    
    if (data.meetingMode === 'Online' && !data.meetingLink) {
      errors.meetingLink = 'Meeting link is required for online meetings';
    }

    // Check if date is in the future
    if (data.dateTime) {
      const selectedDate = new Date(data.dateTime);
      if (selectedDate <= new Date()) {
        errors.dateTime = 'Appointment date must be in the future';
      }
    }

    return errors;
  },

  // Check if user can perform action
  canPerformAction: (userType, action, appointmentStatus) => {
    const permissions = {
      client: {
        create: true,
        edit: false,
        delete: true, // Can cancel
        view: true,
        accept: false,
        reject: false,
        complete: false
      },
      lawyer: {
        create: false,
        edit: true,
        delete: true, // Can cancel
        view: true,
        accept: true,
        reject: true,
        complete: true
      },
      admin: {
        create: true,
        edit: true,
        delete: true,
        view: true,
        accept: true,
        reject: true,
        complete: true
      }
    };

    return permissions[userType]?.[action] || false;
  },

  // Get available statuses for user
  getAvailableStatuses: (userType, currentStatus) => {
    const statusTransitions = {
      client: {
        Pending: ['Cancelled'],
        Accepted: ['Cancelled'],
        Rejected: [],
        Completed: [],
        Cancelled: []
      },
      lawyer: {
        Pending: ['Accepted', 'Rejected', 'Cancelled'],
        Accepted: ['Completed', 'Cancelled'],
        Rejected: [],
        Completed: [],
        Cancelled: []
      },
      admin: {
        Pending: ['Accepted', 'Rejected', 'Cancelled'],
        Accepted: ['Completed', 'Cancelled'],
        Rejected: ['Accepted'],
        Completed: [],
        Cancelled: []
      }
    };

    return statusTransitions[userType]?.[currentStatus] || [];
  }
};

export default appointmentApi; 