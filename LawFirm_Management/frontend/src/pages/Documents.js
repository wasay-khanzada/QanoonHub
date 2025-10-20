import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  DocumentIcon,
  DownloadIcon
} from '@heroicons/react/24/outline';
import DocumentModal from '../components/DocumentModal';

const Documents = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery('documents', async () => {
    const response = await axios.get('/api/documents/all');
    return response.data;
  });

  const deleteDocumentMutation = useMutation(
    async (documentId) => {
      await axios.delete(`/api/documents/${documentId}/${selectedDocument?.doc_case_related}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        toast.success('Document deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete document');
      },
    }
  );

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const handleEditDocument = (documentData) => {
    setSelectedDocument(documentData);
    setIsEditModalOpen(true);
  };

  const handleViewDocument = (documentData) => {
    window.open(documentData.doc_link_onlineDrive, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp)).toLocaleDateString();
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.doc_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.doc_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.doc_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-secondary-300">Manage your legal documents</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-secondary-700 p-4 rounded-lg shadow-sm border border-secondary-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Search Documents
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Document Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white"
            >
              <option value="all">All Types</option>
              <option value="Contract">Contract</option>
              <option value="Legal Brief">Legal Brief</option>
              <option value="Evidence">Evidence</option>
              <option value="Court Filing">Court Filing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="w-full px-4 py-2 text-sm text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-secondary-700 rounded-lg shadow-sm border border-secondary-600">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <DocumentIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No documents found</h3>
            <p className="mt-1 text-sm text-secondary-300">
              {searchTerm || typeFilter !== 'all' 
                ? 'No documents match your current filters.'
                : 'Get started by uploading your first document.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-600">
            {filteredDocuments.map((document) => (
              <div key={document._id} className="p-6 hover:bg-secondary-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {document.doc_title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-primary-600 bg-primary-100">
                        {document.doc_type}
                      </span>
                    </div>
                    
                    <p className="text-secondary-300 mb-3">
                      {document.doc_description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-400">Size:</span>
                        <span className="text-white ml-2">{formatFileSize(document.filesize)}</span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Uploaded:</span>
                        <span className="text-white ml-2">{formatDate(document.uploaded_at)}</span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Case:</span>
                        <span className="text-white ml-2">{document.relatedCaseName?.case_title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Uploaded by:</span>
                        <span className="text-white ml-2">{document.uploadedByUserName?.username || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewDocument(document)}
                      className="p-2 text-secondary-400 hover:text-secondary-200"
                      title="View Document"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditDocument(document)}
                      className="p-2 text-secondary-400 hover:text-secondary-200"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document._id)}
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
        <DocumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries('documents');
          }}
        />
      )}

      {isEditModalOpen && selectedDocument && (
        <DocumentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDocument(null);
          }}
          mode="edit"
          document={selectedDocument}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedDocument(null);
            queryClient.invalidateQueries('documents');
          }}
        />
      )}
    </div>
  );
};

export default Documents; 