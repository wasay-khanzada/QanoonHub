import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Applications = () => {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch lawyer's applications
  const { data: applications = [], isLoading, error } = useQuery('lawyerApplications', async () => {
    try {
      const response = await axios.get('/api/applications/my-applications');
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }, {
    retry: 1,
    onError: (error) => {
      console.error('Applications query error:', error);
      toast.error('Failed to load applications');
    }
  });

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Accepted': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return ClockIcon;
      case 'Accepted': return CheckCircleIcon;
      case 'Rejected': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setIsDetailModalOpen(true);
  };

  const stats = [
    {
      name: 'Total Applications',
      value: applications.length,
      color: 'text-blue-600'
    },
    {
      name: 'Pending',
      value: applications.filter(app => app.application?.status === 'Pending').length,
      color: 'text-yellow-600'
    },
    {
      name: 'Accepted',
      value: applications.filter(app => app.application?.status === 'Accepted').length,
      color: 'text-green-600'
    },
    {
      name: 'Rejected',
      value: applications.filter(app => app.application?.status === 'Rejected').length,
      color: 'text-red-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <XCircleIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading applications</h3>
        <p className="text-gray-500 mb-4">There was a problem loading your applications.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600">Track your case applications and their status</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                {stat.name === 'Pending' && <ClockIcon className="h-6 w-6" />}
                {stat.name === 'Accepted' && <CheckCircleIcon className="h-6 w-6" />}
                {stat.name === 'Rejected' && <XCircleIcon className="h-6 w-6" />}
                {stat.name === 'Total Applications' && <EyeIcon className="h-6 w-6" />}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Application History</h2>
        </div>
        <div className="p-6">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start applying for cases to see your applications here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((item) => {
                const StatusIcon = getApplicationStatusIcon(item.application?.status);
                return (
                  <div key={item.case._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.case.case_title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(item.application?.status)}`}>
                            {item.application?.status || 'Unknown'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">
                          {item.case.case_description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">Case Type:</span>
                            <p className="text-sm font-medium">{item.case.case_type}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Client:</span>
                            <p className="text-sm font-medium">{item.case.client_id?.username || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Proposed Fee:</span>
                            <p className="text-sm font-medium">${item.application?.proposed_fee || 0}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Applied:</span>
                            <p className="text-sm font-medium">
                              {item.application?.application_date ? 
                                new Date(item.application.application_date).toLocaleDateString() : 
                                'Unknown'
                              }
                            </p>
                          </div>
                        </div>

                        {item.application?.message && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Your Message:</span> {item.application.message}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleViewApplication(item)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {isDetailModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Application Details: {selectedApplication.case.case_title}
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Case Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Title:</span> {selectedApplication.case.case_title}</p>
                  <p><span className="font-medium">Type:</span> {selectedApplication.case.case_type}</p>
                  <p><span className="font-medium">Priority:</span> {selectedApplication.case.case_priority}</p>
                  <p><span className="font-medium">Estimated Hours:</span> {selectedApplication.case.case_total_billed_hour}</p>
                  <p><span className="font-medium">Client:</span> {selectedApplication.case.client_id?.username || 'Unknown'}</p>
                  <p><span className="font-medium">Description:</span> {selectedApplication.case.case_description}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Application</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(selectedApplication.application?.status)}`}>
                      {selectedApplication.application?.status || 'Unknown'}
                    </span>
                  </p>
                  <p><span className="font-medium">Proposed Fee:</span> ${selectedApplication.application?.proposed_fee || 0}</p>
                  <p><span className="font-medium">Applied Date:</span> {
                    selectedApplication.application?.application_date ? 
                      new Date(selectedApplication.application.application_date).toLocaleDateString() : 
                      'Unknown'
                  }</p>
                  {selectedApplication.application?.message && (
                    <div className="mt-2">
                      <p className="font-medium">Your Message:</p>
                      <p className="text-sm text-gray-700 mt-1">{selectedApplication.application.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications; 