import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  VideoCameraIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AppointmentModal from '../components/AppointmentModal';
import AppointmentDetailModal from '../components/AppointmentDetailModal';

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  // Fetch appointments with filters
  const { data: appointments = [], isLoading, error } = useQuery(
    ['appointments', statusFilter, dateFilter, searchTerm],
    async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`/api/appointments?${params}`);
      return response.data.data || [];
    },
    {
      retry: 1,
      onError: (error) => {
        console.error('Appointments query error:', error);
        toast.error('Failed to load appointments');
      }
    }
  );

  // Mutations
  const updateAppointmentMutation = useMutation(
    async ({ id, data }) => {
      await axios.put(`/api/appointments/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        toast.success('Appointment updated successfully');
        setIsEditModalOpen(false);
        setSelectedAppointment(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update appointment');
      },
    }
  );

  const deleteAppointmentMutation = useMutation(
    async (appointmentId) => {
      await axios.delete(`/api/appointments/${appointmentId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        toast.success('Appointment cancelled successfully');
      },
      onError: () => {
        toast.error('Failed to cancel appointment');
      },
    }
  );

  const handleCreateAppointment = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleDeleteAppointment = (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  const handleStatusUpdate = (appointmentId, newStatus) => {
    updateAppointmentMutation.mutate({
      id: appointmentId,
      data: { status: newStatus }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Accepted': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      case 'Cancelled': return 'text-secondary-400 bg-secondary-200';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  const getMeetingModeIcon = (mode) => {
    return mode === 'Online' ? VideoCameraIcon : MapPinIcon;
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    };
  };

  const canCreateAppointments = user?.type === 'client' || user?.type === 'admin';
  const canEditAppointments = user?.type === 'lawyer' || user?.type === 'admin';
  const canDeleteAppointments = user?.type === 'client' || user?.type === 'lawyer' || user?.type === 'admin';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-secondary-300">Manage your appointments and meetings</p>
        </div>
        {canCreateAppointments && (
          <button
            onClick={handleCreateAppointment}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Appointment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-secondary-700 p-4 rounded-lg shadow-sm border border-secondary-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="w-full px-4 py-2 text-sm text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-secondary-700 rounded-lg shadow-sm border border-secondary-600">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No appointments</h3>
            <p className="mt-1 text-sm text-secondary-300">
              {canCreateAppointments 
                ? 'Get started by creating a new appointment.'
                : 'No appointments found matching your criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-600">
            {appointments.map((appointment) => {
              const { date, time, full } = formatDateTime(appointment.dateTime);
              const MeetingModeIcon = getMeetingModeIcon(appointment.meetingMode);
              
              return (
                <div key={appointment._id} className="p-6 hover:bg-secondary-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <div className="flex items-center gap-1 text-secondary-300">
                          <MeetingModeIcon className="h-4 w-4" />
                          <span className="text-sm">{appointment.meetingMode}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">
                            {user?.type === 'client' 
                              ? appointment.lawyerId?.username 
                              : appointment.clientId?.username
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DocumentIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">
                            {appointment.caseId?.case_title}
                          </span>
                        </div>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-secondary-300 mb-3">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      )}

                      {appointment.meetingLink && appointment.meetingMode === 'Online' && (
                        <div className="flex items-center gap-2 mb-3">
                          <VideoCameraIcon className="h-4 w-4 text-primary-600" />
                          <a 
                            href={appointment.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-500"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewAppointment(appointment)}
                        className="p-2 text-secondary-400 hover:text-secondary-200"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {canEditAppointments && appointment.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'Accepted')}
                            className="p-2 text-green-400 hover:text-green-300"
                            title="Accept"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'Rejected')}
                            className="p-2 text-red-400 hover:text-red-300"
                            title="Reject"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {canEditAppointments && appointment.status === 'Accepted' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'Completed')}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Mark as Completed"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canEditAppointments && (
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="p-2 text-secondary-400 hover:text-secondary-200"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canDeleteAppointments && appointment.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleDeleteAppointment(appointment._id)}
                          className="p-2 text-red-400 hover:text-red-300"
                          title="Cancel"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <AppointmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries('appointments');
          }}
        />
      )}

      {isEditModalOpen && selectedAppointment && (
        <AppointmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAppointment(null);
          }}
          mode="edit"
          appointment={selectedAppointment}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedAppointment(null);
            queryClient.invalidateQueries('appointments');
          }}
        />
      )}

      {isDetailModalOpen && selectedAppointment && (
        <AppointmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

export default Appointments; 