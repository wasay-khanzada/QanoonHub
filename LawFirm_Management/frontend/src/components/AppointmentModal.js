import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentIcon,
  VideoCameraIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const AppointmentModal = ({ isOpen, onClose, mode = 'create', appointment = null, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    clientId: '',
    lawyerId: '',
    caseId: '',
    dateTime: '',
    meetingMode: 'Offline',
    meetingLink: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch available lawyers
  const { data: lawyers = [] } = useQuery(
    ['lawyers', formData.caseId],
    async () => {
      const params = formData.caseId ? `?caseId=${formData.caseId}` : '';
      const response = await axios.get(`/api/appointments/lawyers/available${params}`);
      return response.data.data || [];
    },
    {
      enabled: isOpen && (user?.type === 'client' || user?.type === 'admin'),
      onError: () => {
        toast.error('Failed to load lawyers');
      }
    }
  );

  // Fetch client cases
  const { data: cases = [] } = useQuery(
    'clientCases',
    async () => {
      const response = await axios.get('/api/appointments/cases/client');
      return response.data.data || [];
    },
    {
      enabled: isOpen && user?.type === 'client',
      onError: () => {
        toast.error('Failed to load cases');
      }
    }
  );

  // Create/Update mutation
  const appointmentMutation = useMutation(
    async (data) => {
      if (mode === 'create') {
        await axios.post('/api/appointments', data);
      } else {
        await axios.put(`/api/appointments/${appointment._id}`, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(mode === 'create' ? 'Appointment created successfully' : 'Appointment updated successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to save appointment');
      },
    }
  );

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && appointment) {
      const dateTime = new Date(appointment.dateTime);
      const localDateTime = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000);
      
      setFormData({
        clientId: appointment.clientId._id,
        lawyerId: appointment.lawyerId._id,
        caseId: appointment.caseId._id,
        dateTime: localDateTime.toISOString().slice(0, 16),
        meetingMode: appointment.meetingMode,
        meetingLink: appointment.meetingLink || '',
        notes: appointment.notes || ''
      });
    } else if (mode === 'create') {
      // Set default values based on user type
      const defaultData = {
        clientId: user?.type === 'client' ? user.userId : '',
        lawyerId: '',
        caseId: '',
        dateTime: '',
        meetingMode: 'Offline',
        meetingLink: '',
        notes: ''
      };
      setFormData(defaultData);
    }
  }, [mode, appointment, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.lawyerId) newErrors.lawyerId = 'Lawyer is required';
    if (!formData.caseId) newErrors.caseId = 'Case is required';
    if (!formData.dateTime) newErrors.dateTime = 'Date and time is required';
    if (!formData.meetingMode) newErrors.meetingMode = 'Meeting mode is required';
    
    if (formData.meetingMode === 'Online' && !formData.meetingLink) {
      newErrors.meetingLink = 'Meeting link is required for online meetings';
    }

    // Check if date is in the future
    if (formData.dateTime) {
      const selectedDate = new Date(formData.dateTime);
      if (selectedDate <= new Date()) {
        newErrors.dateTime = 'Appointment date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      dateTime: new Date(formData.dateTime).toISOString()
    };

    // Remove empty fields
    if (!submitData.meetingLink) delete submitData.meetingLink;
    if (!submitData.notes) delete submitData.notes;

    appointmentMutation.mutate(submitData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-secondary-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-secondary-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                {mode === 'create' ? 'Create New Appointment' : 'Edit Appointment'}
              </h3>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Selection (Admin only) */}
              {user?.type === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Client
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                      errors.clientId ? 'border-red-500' : 'border-secondary-600'
                    }`}
                  >
                    <option value="">Select Client</option>
                    {/* You would need to fetch clients here */}
                    <option value="client1">Client 1</option>
                    <option value="client2">Client 2</option>
                  </select>
                  {errors.clientId && (
                    <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
                  )}
                </div>
              )}

              {/* Lawyer Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Lawyer
                </label>
                <select
                  value={formData.lawyerId}
                  onChange={(e) => handleInputChange('lawyerId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                    errors.lawyerId ? 'border-red-500' : 'border-secondary-600'
                  }`}
                >
                  <option value="">Select Lawyer</option>
                  {lawyers.map((lawyer) => (
                    <option key={lawyer._id} value={lawyer._id}>
                      {lawyer.username} - {lawyer.specializations?.join(', ')}
                    </option>
                  ))}
                </select>
                {errors.lawyerId && (
                  <p className="text-red-500 text-xs mt-1">{errors.lawyerId}</p>
                )}
              </div>

              {/* Case Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Case
                </label>
                <select
                  value={formData.caseId}
                  onChange={(e) => handleInputChange('caseId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                    errors.caseId ? 'border-red-500' : 'border-secondary-600'
                  }`}
                >
                  <option value="">Select Case</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem._id} value={caseItem._id}>
                      {caseItem.case_title} - {caseItem.case_type}
                    </option>
                  ))}
                </select>
                {errors.caseId && (
                  <p className="text-red-500 text-xs mt-1">{errors.caseId}</p>
                )}
              </div>

              {/* Date and Time */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => handleInputChange('dateTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                    errors.dateTime ? 'border-red-500' : 'border-secondary-600'
                  }`}
                />
                {errors.dateTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateTime}</p>
                )}
              </div>

              {/* Meeting Mode */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Meeting Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Offline"
                      checked={formData.meetingMode === 'Offline'}
                      onChange={(e) => handleInputChange('meetingMode', e.target.value)}
                      className="mr-2"
                    />
                    <MapPinIcon className="h-4 w-4 mr-1 text-secondary-300" />
                    <span className="text-secondary-200">Offline</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Online"
                      checked={formData.meetingMode === 'Online'}
                      onChange={(e) => handleInputChange('meetingMode', e.target.value)}
                      className="mr-2"
                    />
                    <VideoCameraIcon className="h-4 w-4 mr-1 text-secondary-300" />
                    <span className="text-secondary-200">Online</span>
                  </label>
                </div>
                {errors.meetingMode && (
                  <p className="text-red-500 text-xs mt-1">{errors.meetingMode}</p>
                )}
              </div>

              {/* Meeting Link (Online only) */}
              {formData.meetingMode === 'Online' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400 ${
                      errors.meetingLink ? 'border-red-500' : 'border-secondary-600'
                    }`}
                  />
                  {errors.meetingLink && (
                    <p className="text-red-500 text-xs mt-1">{errors.meetingLink}</p>
                  )}
                </div>
              )}

              {/* Notes (Lawyer only) */}
              {user?.type === 'lawyer' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Add any notes about the appointment..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-secondary-300 bg-secondary-800 border border-secondary-600 rounded-md hover:bg-secondary-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appointmentMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {appointmentMutation.isLoading ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal; 