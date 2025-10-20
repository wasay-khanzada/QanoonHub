import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const BillingModal = ({ isOpen, onClose, mode = 'create', invoice = null, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    caseId: '',
    lawyerId: '',
    clientId: '',
    amount: '',
    dueDate: '',
    paymentMethod: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch available cases
  const { data: cases = [] } = useQuery(
    'availableCases',
    async () => {
      const response = await axios.get('/api/billing/cases/available');
      return response.data.data || [];
    },
    {
      enabled: isOpen && (user?.type === 'lawyer' || user?.type === 'admin'),
      onError: () => {
        toast.error('Failed to load cases');
      }
    }
  );

  // Create/Update mutation
  const invoiceMutation = useMutation(
    async (data) => {
      if (mode === 'create') {
        await axios.post('/api/billing', data);
      } else {
        await axios.put(`/api/billing/${invoice._id}`, data);
      }
    },
    {
      onSuccess: () => {
        toast.success(mode === 'create' ? 'Invoice created successfully' : 'Invoice updated successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to save invoice');
      },
    }
  );

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && invoice) {
      const dueDate = new Date(invoice.dueDate);
      const localDueDate = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000);

      setFormData({
        caseId: invoice.caseId._id,
        lawyerId: invoice.lawyerId._id,
        clientId: invoice.clientId._id,
        amount: invoice.amount.toString(),
        dueDate: localDueDate.toISOString().slice(0, 10),
        paymentMethod: invoice.paymentMethod || '',
        notes: invoice.notes || ''
      });
    } else if (mode === 'create') {
      // Set default values based on user type
      const defaultData = {
        caseId: '',
        lawyerId: user?.type === 'lawyer' ? user.userId : '',
        clientId: '',
        amount: '',
        dueDate: '',
        paymentMethod: '',
        notes: ''
      };
      setFormData(defaultData);
    }
  }, [mode, invoice, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.caseId) newErrors.caseId = 'Case is required';
    if (!formData.lawyerId) newErrors.lawyerId = 'Lawyer is required';
    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';

    // Validate amount
    if (formData.amount && (isNaN(formData.amount) || parseFloat(formData.amount) <= 0)) {
      newErrors.amount = 'Amount must be a positive number';
    }

    // Check if due date is in the future
    if (formData.dueDate) {
      const selectedDate = new Date(formData.dueDate);
      if (selectedDate <= new Date()) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate).toISOString()
    };

    // Remove empty fields
    if (!submitData.paymentMethod) delete submitData.paymentMethod;
    if (!submitData.notes) delete submitData.notes;

    invoiceMutation.mutate(submitData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCaseChange = (caseId) => {
    const selectedCase = cases.find(c => c._id === caseId);
    if (selectedCase) {
      setFormData(prev => ({
        ...prev,
        caseId,
        lawyerId: selectedCase.assigned_lawyer_id?._id || selectedCase.assigned_lawyer_id,
        clientId: selectedCase.client_id?._id || selectedCase.client_id
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-secondary-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-secondary-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                {mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
              </h3>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Case Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Case
                </label>
                <select
                  value={formData.caseId}
                  onChange={(e) => handleCaseChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                    errors.caseId ? 'border-red-500' : 'border-secondary-600'
                  }`}
                >
                  <option value="">Select Case</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem._id} value={caseItem._id}>
                      {caseItem.case_title} - {caseItem.case_type}
                    </option>
                  ))}
                </select>
                {errors.caseId && (
                  <p className="text-red-500 text-xs mt-1">{errors.caseId}</p>
                )}
              </div>

              {/* Lawyer Selection (Admin only) */}
              {user?.type === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Lawyer
                  </label>
                  <select
                    value={formData.lawyerId}
                    onChange={(e) => handleInputChange('lawyerId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                      errors.lawyerId ? 'border-red-500' : 'border-secondary-600'
                    }`}
                  >
                    <option value="">Select Lawyer</option>
                    {/* You would need to fetch lawyers here */}
                    <option value="lawyer1">Lawyer 1</option>
                    <option value="lawyer2">Lawyer 2</option>
                  </select>
                  {errors.lawyerId && (
                    <p className="text-red-500 text-xs mt-1">{errors.lawyerId}</p>
                  )}
                </div>
              )}

              {/* Client Selection (Admin only) */}
              {user?.type === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Client
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                      errors.clientId ? 'border-red-500' : 'border-secondary-600'
                    }`}
                  >
                    <option value="">Select Client</option>
                    {/* You would need to fetch clients here */}
                    <option value="client1">Client 1</option>
                    <option value="client2">Client 2</option>
                  </select>
                  {errors.clientId && (
                    <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400 ${
                      errors.amount ? 'border-red-500' : 'border-secondary-600'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className={`w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white ${
                      errors.dueDate ? 'border-red-500' : 'border-secondary-600'
                    }`}
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Payment Method (Optional)
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white"
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Add any notes about the invoice..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-secondary-300 bg-secondary-800 border border-secondary-600 rounded-md hover:bg-secondary-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {invoiceMutation.isLoading ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingModal; 