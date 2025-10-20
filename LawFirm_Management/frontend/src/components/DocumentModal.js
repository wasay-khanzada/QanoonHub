import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';

const DocumentModal = ({ isOpen, onClose, mode = 'create', documentData = null }) => {
  const [formData, setFormData] = useState({
    doc_title: '',
    doc_description: '',
    doc_type: '',
    doc_case_related: '',
    can_be_access_by: []
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch user cases for dropdown
  const { data: userCases = [], isLoading: casesLoading } = useQuery('userCases', async () => {
    const response = await axios.get('/api/documents/cases/user');
    return response.data.data || [];
  }, {
    enabled: isOpen && mode === 'create' // Only fetch when modal is open and in create mode
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      setSelectedFile(acceptedFiles[0]);
    }
  });

  useEffect(() => {
    if (mode === 'edit' && documentData) {
      setFormData({
        doc_title: documentData.doc_title || '',
        doc_description: documentData.doc_description || '',
        doc_type: documentData.doc_type || '',
        doc_case_related: documentData.doc_case_related || '',
        can_be_access_by: documentData.can_be_access_by || []
      });
    }
  }, [mode, documentData]);

  const uploadDocumentMutation = useMutation(
    async (formDataToSend) => {
      const data = new FormData();
      data.append('docUpload', selectedFile);
      data.append('doc_title', formDataToSend.doc_title);
      data.append('doc_description', formDataToSend.doc_description);
      data.append('doc_type', formDataToSend.doc_type);
      data.append('doc_case_related', formDataToSend.doc_case_related);
      data.append('filesize', selectedFile.size);
      data.append('uploaded_at', Date.now());

      await axios.post('/api/documents', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        toast.success('Document uploaded successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to upload document');
      },
    }
  );

  const updateDocumentMutation = useMutation(
    async (data) => {
      await axios.put('/api/documents', {
        q: {
          q_id: documentData._id,
          q_caseId: documentData.doc_case_related
        },
        ...data
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        toast.success('Document updated successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update document');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'create' && !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (mode === 'create') {
      uploadDocumentMutation.mutate(formData);
    } else {
      updateDocumentMutation.mutate(formData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      doc_title: '',
      doc_description: '',
      doc_type: '',
      doc_case_related: '',
      can_be_access_by: []
    });
    setSelectedFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Upload Document' : 'Edit Document'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop a PDF file here, or click to select'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Only PDF files are accepted</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Document Title
            </label>
            <input
              type="text"
              name="doc_title"
              value={formData.doc_title}
              onChange={handleChange}
              required
              className="input-field mt-1"
              placeholder="Enter document title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="doc_description"
              value={formData.doc_description}
              onChange={handleChange}
              required
              rows={3}
              className="input-field mt-1"
              placeholder="Enter document description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <select
                name="doc_type"
                value={formData.doc_type}
                onChange={handleChange}
                required
                className="input-field mt-1"
              >
                <option value="">Select document type</option>
                <option value="Contract">Contract</option>
                <option value="Legal Brief">Legal Brief</option>
                <option value="Evidence">Evidence</option>
                <option value="Court Filing">Court Filing</option>
                <option value="Correspondence">Correspondence</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Related Case
              </label>
              <select
                name="doc_case_related"
                value={formData.doc_case_related}
                onChange={handleChange}
                required
                className="input-field mt-1"
                disabled={casesLoading}
              >
                <option value="">
                  {casesLoading ? 'Loading cases...' : 'Select a case'}
                </option>
                {userCases.map(caseItem => (
                  <option key={caseItem._id} value={caseItem._id}>
                    {caseItem.case_title} ({caseItem.case_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadDocumentMutation.isLoading || updateDocumentMutation.isLoading}
              className="btn-primary"
            >
              {uploadDocumentMutation.isLoading || updateDocumentMutation.isLoading
                ? 'Saving...'
                : mode === 'create' ? 'Upload Document' : 'Update Document'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentModal; 