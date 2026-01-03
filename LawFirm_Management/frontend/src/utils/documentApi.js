import axios from 'axios';

// Configure axios to send credentials
axios.defaults.withCredentials = true;

// Get user cases for document creation
export const getUserCases = async () => {
  const response = await axios.get('/api/documents/cases/user');
  return response.data.data || [];
};

// Get all documents
export const getAllDocuments = async () => {
  const response = await axios.get('/api/documents/all');
  return response.data;
};

// Get documents by case
export const getDocumentsByCase = async (caseId) => {
  const response = await axios.get(`/api/documents/all/${caseId}`);
  return response.data;
};

// Get single document
export const getDocument = async (documentId, caseId) => {
  const response = await axios.get(`/api/documents/${documentId}/${caseId}`);
  return response.data;
};

// Create template-based document
export const createTemplateDocument = async (data) => {
  const response = await axios.post('/api/documents', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Upload document file
export const uploadDocument = async (formData) => {
  const response = await axios.post('/api/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update document
export const updateDocument = async (data) => {
  const response = await axios.put('/api/documents', data);
  return response.data;
};

// Delete document
export const deleteDocument = async (documentId, caseId) => {
  const response = await axios.delete(`/api/documents/${documentId}/${caseId}`);
  return response.data;
};

// Generate document file (PDF/DOCX)
export const generateDocumentFile = async (documentId, format, templateData) => {
  const response = await axios.post(
    '/api/documents/generate-template',
    {
      documentId,
      format,
      templateData,
    },
    {
      responseType: 'blob', // Important for file download
    }
  );
  return response.data;
};

// Download file helper
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

