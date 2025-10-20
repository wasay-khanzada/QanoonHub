import React from 'react';
import { XMarkIcon, CurrencyDollarIcon, CalendarIcon, DocumentTextIcon, UserIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

const BillingDetailModal = ({ isOpen, onClose, invoice }) => {
  if (!isOpen || !invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
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

  const StatusIcon = getStatusIcon(invoice.status);
  const isOverdue = invoice.status === 'Unpaid' && new Date() > new Date(invoice.dueDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-secondary-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-secondary-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Invoice Details</h3>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Invoice Number and Status */}
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-white">
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

              {/* Amount */}
              <div className="flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-white">Amount</p>
                  <p className="text-lg font-semibold text-primary-600">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Issued Date</p>
                    <p className="text-sm text-secondary-300">{formatDate(invoice.issuedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Due Date</p>
                    <p className="text-sm text-secondary-300">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Case Information */}
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-sm font-medium text-white">Case</p>
                  <p className="text-sm text-secondary-300">{invoice.caseId?.case_title}</p>
                  <p className="text-xs text-secondary-400">{invoice.caseId?.case_type}</p>
                </div>
              </div>

              {/* Client and Lawyer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Client</p>
                    <p className="text-sm text-secondary-300">{invoice.clientId?.username}</p>
                    <p className="text-xs text-secondary-400">{invoice.clientId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-secondary-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Lawyer</p>
                    <p className="text-sm text-secondary-300">{invoice.lawyerId?.username}</p>
                    <p className="text-xs text-secondary-400">{invoice.lawyerId?.email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              {invoice.paymentMethod && (
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-white">Payment Method</p>
                    <p className="text-sm text-secondary-300">{invoice.paymentMethod}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div className="flex items-start gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Notes</p>
                    <p className="text-sm text-secondary-300">{invoice.notes}</p>
                  </div>
                </div>
              )}

              {/* Created By */}
              <div className="pt-4 border-t border-secondary-600">
                <p className="text-xs text-secondary-400">
                  Created by: {invoice.createdBy?.username} •
                  Created: {formatDate(invoice.createdAt)}
                </p>
                {invoice.updatedAt !== invoice.createdAt && (
                  <p className="text-xs text-secondary-400">
                    Last updated: {formatDate(invoice.updatedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-secondary-300 bg-secondary-800 border border-secondary-600 rounded-md hover:bg-secondary-700 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetailModal; 