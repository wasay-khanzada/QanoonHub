import React, { useState } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import CaseChat from './CaseChat';

const CaseDetailModal = ({ isOpen, onClose, caseData }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  if (!isOpen || !caseData) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-blue-600 bg-blue-100';
      case 'Closed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Case Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Case Header */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {caseData.case_title}
            </h2>
            <p className="text-gray-600">
              {caseData.case_description}
            </p>
          </div>

          {/* Case Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Case Type</label>
                <p className="text-sm text-gray-900">{caseData.case_type}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseData.case_status)}`}>
                  {caseData.case_status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Priority</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseData.case_priority)}`}>
                  {caseData.case_priority}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Billed Hours</label>
                <p className="text-sm text-gray-900">{caseData.case_total_billed_hour} hours</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Client</label>
                <p className="text-sm text-gray-900">
                  {caseData.client_id?.username || caseData.client_id || 'N/A'}
                </p>
                {caseData.client_id?.email && (
                  <p className="text-xs text-gray-500">{caseData.client_id.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Assigned Lawyer</label>
                <p className="text-sm text-gray-900">
                  {caseData.assigned_lawyer_id?.username || caseData.assigned_lawyer_id || 'Not Assigned'}
                </p>
                {caseData.assigned_lawyer_id?.email && (
                  <p className="text-xs text-gray-500">{caseData.assigned_lawyer_id.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Case ID</label>
                <p className="text-sm text-gray-900 font-mono">{caseData._id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">
                  {new Date(caseData.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {new Date(caseData.updatedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-3">Team Members</label>
            <div className="bg-gray-50 rounded-lg p-4">
              {caseData.case_member_list && caseData.case_member_list.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseData.case_member_list.map((member, index) => {
                    // Handle populated case_member_id (object) or plain ID (string)
                    const memberName = typeof member.case_member_id === 'object' 
                      ? member.case_member_id?.username || member.case_member_id?._id || 'Unknown'
                      : member.case_member_id || 'Unknown';
                    
                    const memberEmail = typeof member.case_member_id === 'object' 
                      ? member.case_member_id?.email 
                      : null;

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {memberName}
                          </p>
                          {memberEmail && (
                            <p className="text-xs text-gray-500">{memberEmail}</p>
                          )}
                          <p className="text-xs text-gray-500 capitalize mt-1">
                            {member.case_member_type || 'member'} • {member.case_member_role || 'member'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setIsChatOpen(true)}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            title="Open Chat"
                          >
                            <ChatBubbleLeftIcon className="h-4 w-4" />
                            <span className="text-xs">Chat</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No team members assigned
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <CaseChat
        caseId={caseData._id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default CaseDetailModal; 