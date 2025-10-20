import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import CaseModal from '../components/CaseModal';
import CaseDetailModal from '../components/CaseDetailModal';
import CaseChat from '../components/CaseChat';

const Cases = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: cases = [], isLoading, error } = useQuery('cases', async () => {
    try {
      const response = await axios.get('/api/cases');
      return response.data;
    } catch (error) {
      console.error('Error fetching cases:', error.response?.data || error.message);
      throw error;
    }
  }, {
    retry: 1,
    onError: (error) => {
      console.error('Cases query error:', error);
      toast.error('Failed to load cases');
    }
  });

  const deleteCaseMutation = useMutation(
    async (caseId) => {
      await axios.delete(`/api/cases/${caseId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cases');
        toast.success('Case deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete case');
      },
    }
  );

  const handleDeleteCase = (caseId) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      deleteCaseMutation.mutate(caseId);
    }
  };

  const handleEditCase = (caseData) => {
    setSelectedCase(caseData);
    setIsEditModalOpen(true);
  };

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setIsDetailModalOpen(true);
  };

  const handleOpenChat = (caseData) => {
    setSelectedCase(caseData);
    setIsChatOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-green-600 bg-green-100';
      case 'Closed': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-orange-600 bg-orange-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.case_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.case_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <p className="text-red-600">Failed to load cases</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Cases</h1>
          <p className="text-secondary-300">Manage your legal cases and proceedings</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-secondary-700 p-4 rounded-lg shadow-sm border border-secondary-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Search Cases
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
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
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 text-sm text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-secondary-700 rounded-lg shadow-sm border border-secondary-600">
        {filteredCases.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No cases found</h3>
            <p className="mt-1 text-sm text-secondary-300">
              {searchTerm || statusFilter !== 'all' 
                ? 'No cases match your current filters.'
                : 'Get started by creating a new case.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-600">
            {filteredCases.map((caseItem) => (
              <div key={caseItem._id} className="p-6 hover:bg-secondary-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {caseItem.case_title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.case_status)}`}>
                        {caseItem.case_status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(caseItem.case_priority)}`}>
                        {caseItem.case_priority}
                      </span>
                    </div>
                    
                    <p className="text-secondary-300 mb-3">
                      {caseItem.case_description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-400">Type:</span>
                        <span className="text-white ml-2">{caseItem.case_type}</span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Client:</span>
                        <span className="text-white ml-2">
                          {caseItem.client_id?.username || 'N/A'}
                        </span>
                        {/* Debug info */}
                        <span className="text-xs text-gray-500 ml-2">
                          (ID: {caseItem.client_id?._id || 'null'})
                        </span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Lawyer:</span>
                        <span className="text-white ml-2">
                          {caseItem.assigned_lawyer_id?.username || 'N/A'}
                        </span>
                        {/* Debug info */}
                        <span className="text-xs text-gray-500 ml-2">
                          (ID: {caseItem.assigned_lawyer_id?._id || 'null'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewCase(caseItem)}
                      className="p-2 text-secondary-400 hover:text-secondary-200"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenChat(caseItem)}
                      className="p-2 text-blue-400 hover:text-blue-300"
                      title="Open Chat"
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditCase(caseItem)}
                      className="p-2 text-secondary-400 hover:text-secondary-200"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCase(caseItem._id)}
                      className="p-2 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CaseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries('cases');
          }}
        />
      )}

      {isEditModalOpen && selectedCase && (
        <CaseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCase(null);
          }}
          mode="edit"
          caseData={selectedCase}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedCase(null);
            queryClient.invalidateQueries('cases');
          }}
        />
      )}

      {isDetailModalOpen && selectedCase && (
        <CaseDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCase(null);
          }}
          caseData={selectedCase}
        />
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

export default Cases; 