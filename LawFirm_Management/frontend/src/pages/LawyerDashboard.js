import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import CaseChat from '../components/CaseChat';

const LawyerDashboard = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [applicationData, setApplicationData] = useState({
    message: '',
    proposed_fee: 0
  });

  const queryClient = useQueryClient();

  // Fetch available cases for lawyer
  const { data: cases = [], isLoading: casesLoading } = useQuery('lawyerCases', async () => {
    const response = await axios.get('/api/cases');
    return response.data;
  });

  const applyForCaseMutation = useMutation(
    async ({ caseId, data }) => {
      await axios.post(`/api/cases/${caseId}/apply`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lawyerCases');
        toast.success('Application submitted successfully');
        setIsApplyModalOpen(false);
        setApplicationData({ message: '', proposed_fee: 0 });
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit application');
      },
    }
  );

  const handleApplyForCase = (caseData) => {
    setSelectedCase(caseData);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = () => {
    if (!selectedCase) return;
    
    applyForCaseMutation.mutate({
      caseId: selectedCase._id,
      data: applicationData
    });
  };

  const handleOpenChat = (caseData) => {
    setSelectedCase(caseData);
    setIsChatOpen(true);
  };

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

  const stats = [
    {
      name: 'Available Cases',
      value: cases.filter(c => c.case_status === 'Open').length,
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Assigned Cases',
      value: cases.filter(c => c.assigned_lawyer_id).length,
      icon: CheckCircleIcon,
      color: 'text-green-600'
    },
    {
      name: 'Total Cases',
      value: cases.length,
      icon: UserGroupIcon,
      color: 'text-purple-600'
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
          <h1 className="text-2xl font-bold text-gray-900">Lawyer Dashboard</h1>
          <p className="text-gray-600">Find and manage your cases</p>
        </div>
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

      {/* Available Cases */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Available Cases</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {cases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cases available</h3>
              <p className="mt-1 text-sm text-gray-500">No cases match your specializations.</p>
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
                    {caseItem.client_id && (
                      <p className="text-sm text-gray-500 mt-1">
                        Client: {caseItem.client_id.username}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {caseItem.case_status === 'Open' && (
                      <button
                        onClick={() => handleApplyForCase(caseItem)}
                        className="btn-primary text-sm"
                      >
                        Apply
                      </button>
                    )}
                    {caseItem.assigned_lawyer_id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium">
                          ✓ Assigned
                        </span>
                        <button
                          onClick={() => handleOpenChat(caseItem)}
                          className="btn-secondary text-sm flex items-center space-x-1"
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

      {/* Application Modal */}
      {selectedCase && isApplyModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Apply for {selectedCase.case_title}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={applicationData.message}
                    onChange={(e) => setApplicationData({...applicationData, message: e.target.value})}
                    className="input-field"
                    rows="4"
                    placeholder="Explain why you're the best fit for this case..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed Fee ($)
                  </label>
                  <input
                    type="number"
                    value={applicationData.proposed_fee}
                    onChange={(e) => setApplicationData({...applicationData, proposed_fee: parseFloat(e.target.value) || 0})}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsApplyModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={!applicationData.message || applicationData.proposed_fee <= 0}
                  className="btn-primary"
                >
                  Submit Application
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

export default LawyerDashboard; 