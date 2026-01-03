import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { XMarkIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getUserCases, createTemplateDocument, generateDocumentFile, downloadFile } from '../utils/documentApi';

const TEMPLATE_TYPES = {
  affidavit: {
    name: 'Affidavit',
    description: 'A written statement confirmed by oath or affirmation',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'fatherName', label: 'Father / Husband Name', type: 'text', required: true },
      { name: 'cnic', label: 'CNIC Number', type: 'text', required: true },
      { name: 'address', label: 'Residential Address', type: 'textarea', required: true },
      { name: 'caseTitle', label: 'Case Title', type: 'text', required: true },
      { name: 'caseNumber', label: 'Case Number', type: 'text', required: true },
      { name: 'statement', label: 'Statement on Oath', type: 'textarea', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
    ],
  },
  agreement: {
    name: 'Agreement',
    description: 'A legal contract between two parties',
    fields: [
      { name: 'date', label: 'Agreement Date', type: 'date', required: true },
      { name: 'partyAName', label: 'First Party Name', type: 'text', required: true },
      { name: 'partyAFather', label: 'First Party Father Name', type: 'text', required: true },
      { name: 'partyACNIC', label: 'First Party CNIC', type: 'text', required: true },
      { name: 'partyAAddress', label: 'First Party Address', type: 'textarea', required: true },
      { name: 'partyBName', label: 'Second Party Name', type: 'text', required: true },
      { name: 'partyBFather', label: 'Second Party Father Name', type: 'text', required: true },
      { name: 'partyBCNIC', label: 'Second Party CNIC', type: 'text', required: true },
      { name: 'partyBAddress', label: 'Second Party Address', type: 'textarea', required: true },
      { name: 'purpose', label: 'Purpose of Agreement', type: 'textarea', required: true },
      { name: 'terms', label: 'Terms & Conditions', type: 'textarea', required: true },
    ],
  },
  legalNotice: {
    name: 'Legal Notice',
    description: 'A formal notice sent to resolve disputes',
    fields: [
      { name: 'clientName', label: 'Client Name', type: 'text', required: true },
      { name: 'clientCNIC', label: 'Client CNIC', type: 'text', required: true },
      { name: 'clientAddress', label: 'Client Address', type: 'textarea', required: true },
      { name: 'issueDescription', label: 'Issue Description', type: 'textarea', required: true },
      { name: 'noticePeriod', label: 'Notice Period (Days)', type: 'number', required: true },
      { name: 'date', label: 'Notice Date', type: 'date', required: true },
    ],
  },
  powerOfAttorney: {
    name: 'Power of Attorney',
    description: 'Authorization to act on behalf of another person',
    fields: [
      { name: 'principalName', label: 'Principal Name', type: 'text', required: true },
      { name: 'principalFather', label: 'Principal Father Name', type: 'text', required: true },
      { name: 'principalCNIC', label: 'Principal CNIC', type: 'text', required: true },
      { name: 'principalAddress', label: 'Principal Address', type: 'textarea', required: true },
      { name: 'attorneyName', label: 'Attorney Name', type: 'text', required: true },
      { name: 'attorneyFather', label: 'Attorney Father Name', type: 'text', required: true },
      { name: 'attorneyCNIC', label: 'Attorney CNIC', type: 'text', required: true },
      { name: 'attorneyAddress', label: 'Attorney Address', type: 'textarea', required: true },
      { name: 'powers', label: 'Granted Powers', type: 'textarea', required: true },
      { name: 'date', label: 'Execution Date', type: 'date', required: true },
    ],
  },
};

const DocumentGeneratorModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select template, 2: Fill form, 3: Generate
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedCase, setSelectedCase] = useState('');
  const [generatedDocumentId, setGeneratedDocumentId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const queryClient = useQueryClient();

  // Fetch user cases
  const { data: userCases = [], isLoading: casesLoading } = useQuery(
    'userCases',
    getUserCases,
    {
      enabled: isOpen,
    }
  );

  // Create template document mutation
  const createDocumentMutation = useMutation(
    async (data) => {
      return await createTemplateDocument(data);
    },
    {
      onSuccess: (data) => {
        setGeneratedDocumentId(data._id);
        setStep(3);
        toast.success('Document template created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create document template');
      },
    }
  );

  // Generate file mutation
  const generateFileMutation = useMutation(
    async ({ documentId, format, templateData }) => {
      const blob = await generateDocumentFile(documentId, format, templateData);
      const filename = `${selectedTemplate}_${documentId}_${Date.now()}.${format}`;
      downloadFile(blob, filename);
      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('Document generated and downloaded successfully!');
        queryClient.invalidateQueries('documents');
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate document');
      },
    }
  );

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep(1);
      setSelectedTemplate(null);
      setFormData({});
      setSelectedCase('');
      setGeneratedDocumentId(null);
      setIsGenerating(false);
      setSelectedFormat('pdf');
    }
  }, [isOpen]);

  const handleTemplateSelect = (templateType) => {
    setSelectedTemplate(templateType);
    setFormData({});
    setStep(2);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value,
    });
  };

  const handleCreateDocument = () => {
    if (!selectedCase) {
      toast.error('Please select a case');
      return;
    }

    const requiredFields = TEMPLATE_TYPES[selectedTemplate].fields.filter((f) => f.required);
    const missingFields = requiredFields.filter((f) => !formData[f.name]);

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    createDocumentMutation.mutate({
      template_type: selectedTemplate,
      doc_case_related: selectedCase,
      can_be_access_by: [],
    });
  };

  const handleGenerateFile = () => {
    if (!generatedDocumentId) {
      toast.error('Document ID not found');
      return;
    }

    setIsGenerating(true);
    generateFileMutation.mutate({
      documentId: generatedDocumentId,
      format: selectedFormat,
      templateData: formData,
    });
    setIsGenerating(false);
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          required={field.required}
          rows={4}
          className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          required={field.required}
          className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    return (
      <input
        type={field.type}
        value={value}
        onChange={(e) => handleInputChange(field.name, e.target.value)}
        required={field.required}
        className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-secondary-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-secondary-600">
        {/* Header */}
        <div className="sticky top-0 bg-secondary-700 border-b border-secondary-600 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Document Generator</h2>
            <p className="text-sm text-secondary-300">Create legal documents from templates</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Select Document Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(TEMPLATE_TYPES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key)}
                    className="p-4 border border-secondary-600 rounded-lg hover:border-primary-500 hover:bg-secondary-600 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className="h-8 w-8 text-primary-500 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                        <p className="text-sm text-secondary-300">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Fill Form */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {TEMPLATE_TYPES[selectedTemplate]?.name} - Fill Details
                  </h3>
                  <p className="text-sm text-secondary-300 mt-1">
                    Please provide all required information
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-secondary-400 hover:text-white text-sm"
                >
                  ← Back to Templates
                </button>
              </div>

              {/* Case Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-200 mb-2">
                  Related Case <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white"
                  disabled={casesLoading}
                >
                  <option value="">
                    {casesLoading ? 'Loading cases...' : 'Select a case'}
                  </option>
                  {userCases.map((caseItem) => (
                    <option key={caseItem._id} value={caseItem._id}>
                      {caseItem.case_title} ({caseItem.case_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {TEMPLATE_TYPES[selectedTemplate]?.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-secondary-200 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-secondary-600">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateDocument}
                  disabled={createDocumentMutation.isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createDocumentMutation.isLoading ? 'Creating...' : 'Create Document'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generate File */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Document Template Created!
                </h3>
                <p className="text-sm text-secondary-300">
                  Now generate the document file in your preferred format
                </p>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-200 mb-2">
                  Select Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedFormat('pdf')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedFormat === 'pdf'
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-secondary-600 hover:border-secondary-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-white font-semibold mb-1">PDF</div>
                      <div className="text-xs text-secondary-300">Portable Document Format</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedFormat('docx')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedFormat === 'docx'
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-secondary-600 hover:border-secondary-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-white font-semibold mb-1">DOCX</div>
                      <div className="text-xs text-secondary-300">Microsoft Word Document</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-secondary-600">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerateFile}
                  disabled={isGenerating || generateFileMutation.isLoading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {isGenerating || generateFileMutation.isLoading
                    ? 'Generating...'
                    : `Generate ${selectedFormat.toUpperCase()}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentGeneratorModal;

