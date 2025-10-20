import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  UserGroupIcon,
  PlusIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import CaseModal from '../components/CaseModal';
import CaseChat from '../components/CaseChat';

const ClientDashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isViewApplicationsOpen, setIsViewApplicationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch client's cases
  const { data: cases = [], isLoading: casesLoading } = useQuery('clientCases', async () => {
    const response = await axios.get('/api/cases');
    return response.data;
  });

  // Fetch available lawyers
  const { data: lawyers = [] } = useQuery('lawyers', async () => {
    const response = await axios.get('/api/crm/employee');
    return response.data.filter(lawyer => lawyer.type === 'lawyer' && lawyer.isVerified);
  });

  const createCaseMutation = useMutation(
    async (data) => {
      await axios.post('/api/cases', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clientCases');
        toast.success('Case created successfully');
        setIsCreateModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create case');
      },
    }
  );

  const acceptApplicationMutation = useMutation(
    async ({ caseId, applicationId }) => {
      await axios.put(`/api/cases/${caseId}/applications/${applicationId}/accept`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clientCases');
        toast.success('Application accepted successfully');
        setIsViewApplicationsOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to accept application');
      },
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-blue-600 bg-blue-100';
      case 'Assigned': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-yellow-600 bg-yellow-100';
      case 'Completed': return 'text-purple-600 bg-purple-100';
      case 'Closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Urgent': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewApplications = (caseData) => {
    setSelectedCase(caseData);
    setIsViewApplicationsOpen(true);
  };

  const handleAcceptApplication = (applicationId) => {
    if (!selectedCase) return;
    acceptApplicationMutation.mutate({
      caseId: selectedCase._id,
      applicationId
    });
  };

  const handleOpenChat = (caseData) => {
    setSelectedCase(caseData);
    setIsChatOpen(true);
  };

  const stats = [
    {
      name: 'Total Cases',
      value: cases.length,
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Open Cases',
      value: cases.filter(c => c.case_status === 'Open').length,
      icon: ClockIcon,
      color: 'text-yellow-600'
    },
    {
      name: 'Assigned Cases',
      value: cases.filter(c => c.case_status === 'Assigned').length,
      icon: UserGroupIcon,
      color: 'text-green-600'
    }
  ];

  if (casesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600">Manage your legal cases</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Case</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cases */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">My Cases</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {cases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cases</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first case.</p>
            </div>
          ) : (
            cases.map((caseItem) => (
              <div key={caseItem._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{caseItem.case_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{caseItem.case_description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.case_status)}`}>
                        {caseItem.case_status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(caseItem.case_priority)}`}>
                        {caseItem.case_priority}
                      </span>
                      <span className="text-sm text-gray-500">{caseItem.case_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {caseItem.case_status === 'Open' && caseItem.applications && caseItem.applications.length > 0 && (
                      <button
                        onClick={() => handleViewApplications(caseItem)}
                        className="btn-secondary text-sm"
                      >
                        View Applications ({caseItem.applications.length})
                      </button>
                    )}
                    {caseItem.assigned_lawyer_id && (
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-500">
                          Assigned to: {caseItem.assigned_lawyer_id.username}
                        </div>
                        <button
                          onClick={() => handleOpenChat(caseItem)}
                          className="btn-primary text-sm flex items-center space-x-1"
                        >
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          <span>Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Lawyers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Available Lawyers</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {lawyers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No lawyers available</h3>
              <p className="mt-1 text-sm text-gray-500">No verified lawyers are currently available.</p>
            </div>
          ) : (
            lawyers.map((lawyer) => (
              <div key={lawyer._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{lawyer.username}</h3>
                    <p className="text-sm text-gray-500">{lawyer.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">Specializations:</span>
                      {lawyer.specializations?.map((spec, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Rating: {lawyer.rating || 0}/5</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />

      {/* Applications Modal */}
      {selectedCase && isViewApplicationsOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Applications for {selectedCase.case_title}
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedCase.applications?.map((application) => (
                  <div key={application._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{application.lawyer_id?.username || 'Unknown Lawyer'}</h4>
                        <p className="text-sm text-gray-600 mt-1">{application.message}</p>
                        <p className="text-sm text-gray-500 mt-1">Proposed Fee: ${application.proposed_fee}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          application.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status}
                        </span>
                        {application.status === 'Pending' && (
                          <button
                            onClick={() => handleAcceptApplication(application._id)}
                            className="btn-primary text-xs"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsViewApplicationsOpen(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && selectedCase && (
        <CaseChat
          caseId={selectedCase._id}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedCase(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientDashboard; 