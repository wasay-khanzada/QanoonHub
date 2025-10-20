import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ClientApplications = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch client's cases with applications
  const { data: cases = [], isLoading, error } = useQuery('clientCasesWithApplications', async () => {
    try {
      const response = await axios.get('/api/cases');
      return response.data.filter(caseItem => caseItem.case_applications?.length > 0);
    } catch (error) {
      console.error('Error fetching cases with applications:', error);
      throw error;
    }
  }, {
    retry: 1,
    onError: (error) => {
      console.error('Cases query error:', error);
      toast.error('Failed to load cases with applications');
    }
  });

  const acceptApplicationMutation = useMutation(
    async ({ caseId, applicationId }) => {
      await axios.put(`/api/applications/accept/${caseId}/${applicationId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clientCasesWithApplications');
        queryClient.invalidateQueries('clientCases');
        toast.success('Lawyer application accepted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to accept application');
      },
    }
  );

  const handleAcceptApplication = (caseId, applicationId) => {
    if (window.confirm('Are you sure you want to accept this lawyer for your case?')) {
      acceptApplicationMutation.mutate({ caseId, applicationId });
    }
  };

  const handleViewApplications = (caseData) => {
    setSelectedCase(caseData);
    setIsDetailModalOpen(true);
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Accepted': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const stats = [
    {
      name: 'Cases with Applications',
      value: cases.length,
      color: 'text-blue-600'
    },
    {
      name: 'Total Applications',
      value: cases.reduce((total, caseItem) => total + (caseItem.case_applications?.length || 0), 0),
      color: 'text-green-600'
    },
    {
      name: 'Pending Decisions',
      value: cases.filter(caseItem => caseItem.case_status === 'Open').length,
      color: 'text-yellow-600'
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
        <p className="text-gray-500 mb-4">There was a problem loading your case applications.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Case Applications</h1>
          <p className="text-gray-600">Review lawyer applications for your cases</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                {stat.name === 'Cases with Applications' && <EyeIcon className="h-6 w-6" />}
                {stat.name === 'Total Applications' && <UserIcon className="h-6 w-6" />}
                {stat.name === 'Pending Decisions' && <CheckCircleIcon className="h-6 w-6" />}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cases with Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Cases with Applications</h2>
        </div>
        <div className="p-6">
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">Lawyers will apply for your cases once they're created.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div key={caseItem._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {caseItem.case_title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          caseItem.case_status === 'Open' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100'
                        }`}>
                          {caseItem.case_status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {caseItem.case_description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Type:</span>
                          <p className="text-sm font-medium">{caseItem.case_type}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Priority:</span>
                          <p className="text-sm font-medium">{caseItem.case_priority}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Applications:</span>
                          <p className="text-sm font-medium">{caseItem.case_applications?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Created:</span>
                          <p className="text-sm font-medium">
                            {caseItem.created_at ? 
                              new Date(caseItem.created_at).toLocaleDateString() : 
                              'Unknown'
                            }
                          </p>
                        </div>
                      </div>

                      {caseItem.assigned_lawyer_id && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">Assigned Lawyer:</span> {caseItem.assigned_lawyer_id.username}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {caseItem.case_status === 'Open' && caseItem.case_applications?.length > 0 && (
                        <button
                          onClick={() => handleViewApplications(caseItem)}
                          className="btn-primary text-sm"
                        >
                          View Applications ({caseItem.case_applications.length})
                        </button>
                      )}
                      <button
                        onClick={() => handleViewApplications(caseItem)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Applications Detail Modal */}
      {isDetailModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Applications for: {selectedCase.case_title}
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {selectedCase.case_applications?.map((application, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">Lawyer Application</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Proposed Fee:</span>
                          <p className="text-sm font-medium">${application.proposed_fee || 0}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Applied:</span>
                          <p className="text-sm font-medium">
                            {application.application_date ? 
                              new Date(application.application_date).toLocaleDateString() : 
                              'Unknown'
                            }
                          </p>
                        </div>
                      </div>

                      {application.message && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Message:</span> {application.message}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {selectedCase.case_status === 'Open' && application.status === 'Pending' && (
                        <button
                          onClick={() => handleAcceptApplication(selectedCase._id, application._id)}
                          className="btn-primary text-sm"
                          disabled={acceptApplicationMutation.isLoading}
                        >
                          {acceptApplicationMutation.isLoading ? 'Accepting...' : 'Accept'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

export default ClientApplications; 