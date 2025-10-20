import React from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon, DocumentIcon, VideoCameraIcon, MapPinIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const AppointmentDetailModal = ({ isOpen, onClose, appointment }) => {
  if (!isOpen || !appointment) return null;

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    };
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

  const { date, time, full } = formatDateTime(appointment.dateTime);
  const MeetingModeIcon = getMeetingModeIcon(appointment.meetingMode);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-secondary-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-secondary-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Appointment Details</h3>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
                <div className="flex items-center gap-1 text-secondary-300">
                  <MeetingModeIcon className="h-4 w-4" />
                  <span className="text-sm">{appointment.meetingMode}</span>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Date</p>
                    <p className="text-sm text-secondary-300">{date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Time</p>
                    <p className="text-sm text-secondary-300">{time}</p>
                  </div>
                </div>
              </div>

              {/* Client and Lawyer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Client</p>
                    <p className="text-sm text-secondary-300">{appointment.clientId?.username}</p>
                    <p className="text-xs text-secondary-400">{appointment.clientId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Lawyer</p>
                    <p className="text-sm text-secondary-300">{appointment.lawyerId?.username}</p>
                    <p className="text-xs text-secondary-400">{appointment.lawyerId?.email}</p>
                  </div>
                </div>
              </div>

              {/* Case Information */}
              <div className="flex items-center gap-2">
                <DocumentIcon className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-sm font-medium text-white">Case</p>
                  <p className="text-sm text-secondary-300">{appointment.caseId?.case_title}</p>
                  <p className="text-xs text-secondary-400">{appointment.caseId?.case_type}</p>
                </div>
              </div>

              {/* Meeting Link (if online) */}
              {appointment.meetingMode === 'Online' && appointment.meetingLink && (
                <div className="flex items-center gap-2">
                  <VideoCameraIcon className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-white">Meeting Link</p>
                    <a 
                      href={appointment.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Join Meeting
                    </a>
                  </div>
                </div>
              )}

              {/* Notes */}
              {appointment.notes && (
                <div className="flex items-start gap-2">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Notes</p>
                    <p className="text-sm text-secondary-300">{appointment.notes}</p>
                  </div>
                </div>
              )}

              {/* Created By */}
              <div className="pt-4 border-t border-secondary-600">
                <p className="text-xs text-secondary-400">
                  Created by: {appointment.createdBy} • 
                  Created: {new Date(appointment.createdAt).toLocaleDateString()}
                </p>
                {appointment.updatedAt !== appointment.createdAt && (
                  <p className="text-xs text-secondary-400">
                    Last updated: {new Date(appointment.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-secondary-300 bg-secondary-800 border border-secondary-600 rounded-md hover:bg-secondary-700 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal; 