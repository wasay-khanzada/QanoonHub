import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import BillingModal from '../components/BillingModal';
import BillingDetailModal from '../components/BillingDetailModal';

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  // Fetch invoices with filters
  const { data: invoices = [], isLoading, error } = useQuery(
    ['invoices', statusFilter, dateFilter, searchTerm],
    async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/billing?${params}`);
      return response.data.data || [];
    },
    {
      retry: 1,
      onError: (error) => {
        console.error('Invoices query error:', error);
        toast.error('Failed to load invoices');
      }
    }
  );

  // Fetch billing statistics
  const { data: stats } = useQuery(
    'billingStats',
    async () => {
      const response = await axios.get('/api/billing/stats/overview');
      return response.data.data || {};
    },
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching billing stats:', error);
      }
    }
  );

  // Mutations
  const updateInvoiceMutation = useMutation(
    async ({ id, data }) => {
      await axios.put(`/api/billing/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        toast.success('Invoice updated successfully');
        setIsEditModalOpen(false);
        setSelectedInvoice(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update invoice');
      },
    }
  );

  const deleteInvoiceMutation = useMutation(
    async (invoiceId) => {
      await axios.delete(`/api/billing/${invoiceId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('billingStats');
        toast.success('Invoice deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete invoice');
      },
    }
  );

  const markAsPaidMutation = useMutation(
    async ({ id, paymentMethod }) => {
      await axios.patch(`/api/billing/${id}/paid`, { paymentMethod });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('billingStats');
        toast.success('Invoice marked as paid');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to mark invoice as paid');
      },
    }
  );

  const handleCreateInvoice = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleMarkAsPaid = (invoiceId, paymentMethod) => {
    markAsPaidMutation.mutate({ id: invoiceId, paymentMethod });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-100';
      case 'Unpaid': return 'text-yellow-600 bg-yellow-100';
      case 'Overdue': return 'text-red-600 bg-red-100';
      case 'Cancelled': return 'text-secondary-400 bg-secondary-200';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return CheckCircleIcon;
      case 'Unpaid': return ClockIcon;
      case 'Overdue': return ExclamationTriangleIcon;
      case 'Cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const canCreateInvoices = user?.type === 'lawyer' || user?.type === 'admin';
  const canEditInvoices = user?.type === 'lawyer' || user?.type === 'admin';
  const canDeleteInvoices = user?.type === 'admin';
  const canMarkAsPaid = user?.type === 'client' || user?.type === 'lawyer' || user?.type === 'admin';

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
        <p className="text-red-600">Failed to load invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-secondary-300">Manage invoices and payments</p>
        </div>
        {canCreateInvoices && (
          <button
            onClick={handleCreateInvoice}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Invoice
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-300">Total Invoices</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalInvoices || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-300">Total Amount</p>
              <p className="text-2xl font-semibold text-white">
                {formatCurrency(stats?.totalAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-secondary-700 p-4 rounded-lg shadow-sm border border-secondary-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search invoices..."
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
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="w-full px-4 py-2 text-sm text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-secondary-700 rounded-lg shadow-sm border border-secondary-600">
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No invoices found</h3>
            <p className="mt-1 text-sm text-secondary-300">
              {canCreateInvoices
                ? 'Get started by creating a new invoice.'
                : 'No invoices found matching your criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-600">
            {invoices.map((invoice) => {
              const StatusIcon = getStatusIcon(invoice.status);
              const isOverdue = invoice.status === 'Unpaid' && new Date() > new Date(invoice.dueDate);

              return (
                <div key={invoice._id} className="p-6 hover:bg-secondary-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {invoice.status}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                            Overdue
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">
                            {formatCurrency(invoice.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">
                            Due: {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-300">
                            {invoice.caseId?.case_title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-secondary-300">
                            {user?.type === 'client'
                              ? invoice.lawyerId?.username
                              : invoice.clientId?.username
                            }
                          </span>
                        </div>
                      </div>

                      {invoice.notes && (
                        <p className="text-sm text-secondary-300 mb-3">
                          <strong>Notes:</strong> {invoice.notes}
                        </p>
                      )}

                      {invoice.paymentMethod && (
                        <p className="text-sm text-secondary-300">
                          <strong>Payment Method:</strong> {invoice.paymentMethod}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="p-2 text-secondary-400 hover:text-secondary-200"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {canMarkAsPaid && invoice.status === 'Unpaid' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice._id, 'Online Payment')}
                          className="p-2 text-green-400 hover:text-green-300"
                          title="Mark as Paid"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canEditInvoices && (
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="p-2 text-secondary-400 hover:text-secondary-200"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canDeleteInvoices && (
                        <button
                          onClick={() => handleDeleteInvoice(invoice._id)}
                          className="p-2 text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <BillingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries('invoices');
            queryClient.invalidateQueries('billingStats');
          }}
        />
      )}

      {isEditModalOpen && selectedInvoice && (
        <BillingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedInvoice(null);
          }}
          mode="edit"
          invoice={selectedInvoice}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedInvoice(null);
            queryClient.invalidateQueries('invoices');
            queryClient.invalidateQueries('billingStats');
          }}
        />
      )}

      {isDetailModalOpen && selectedInvoice && (
        <BillingDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};

export default Billing; 