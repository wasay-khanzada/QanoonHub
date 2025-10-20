import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CaseModal = ({ isOpen, onClose, mode = 'create', caseData = null }) => {
  const [formData, setFormData] = useState({
    case_title: '',
    case_description: '',
    case_type: '',
    case_status: 'Open',
    case_priority: 'Medium',
    case_total_billed_hour: 0,
    case_member_list: []
  });

  const [newMember, setNewMember] = useState({
    case_member_id: '',
    case_member_type: 'associates',
    case_member_role: 'member'
  });

  const queryClient = useQueryClient();

  // Fetch users for member selection
  const { data: users = [] } = useQuery('users', async () => {
    try {
      const [clientsResponse, employeesResponse] = await Promise.all([
        axios.get('/api/crm'),
        axios.get('/api/crm/employee')
      ]);
      return [...clientsResponse.data, ...employeesResponse.data];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  });

  useEffect(() => {
    if (mode === 'edit' && caseData) {
      setFormData({
        case_title: caseData.case_title || '',
        case_description: caseData.case_description || '',
        case_type: caseData.case_type || '',
        case_status: caseData.case_status || 'Open',
        case_priority: caseData.case_priority || 'Medium',
        case_total_billed_hour: caseData.case_total_billed_hour || 0,
        case_member_list: caseData.case_member_list?.map(member => ({
          ...member,
          case_member_id: typeof member.case_member_id === 'object' ? member.case_member_id._id : member.case_member_id
        })) || []
      });
    }
  }, [mode, caseData]);

  const createCaseMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/cases', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update the cache with the new case data
        queryClient.setQueryData('cases', (oldData) => {
          if (oldData) {
            return [data.case, ...oldData];
          }
          return [data.case];
        });
        toast.success('Case created successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create case');
      },
    }
  );

  const updateCaseMutation = useMutation(
    async (data) => {
      await axios.put(`/api/cases/${caseData._id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cases');
        toast.success('Case updated successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update case');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'create') {
      createCaseMutation.mutate(formData);
    } else {
      updateCaseMutation.mutate(formData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addMember = () => {
    if (newMember.case_member_id.trim()) {
      setFormData({
        ...formData,
        case_member_list: [...formData.case_member_list, { ...newMember }]
      });
      setNewMember({
        case_member_id: '',
        case_member_type: 'associates',
        case_member_role: 'member'
      });
    }
  };

  const removeMember = (index) => {
    setFormData({
      ...formData,
      case_member_list: formData.case_member_list.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setFormData({
      case_title: '',
      case_description: '',
      case_type: '',
      case_status: 'Open',
      case_priority: 'Medium',
      case_total_billed_hour: 0,
      case_member_list: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create New Case' : 'Edit Case'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Case Title
            </label>
            <input
              type="text"
              name="case_title"
              value={formData.case_title}
              onChange={handleChange}
              required
              className="input-field mt-1"
              placeholder="Enter case title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="case_description"
              value={formData.case_description}
              onChange={handleChange}
              required
              rows={3}
              className="input-field mt-1"
              placeholder="Enter case description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Case Type
              </label>
              <select
                name="case_type"
                value={formData.case_type}
                onChange={handleChange}
                required
                className="input-field mt-1"
              >
                <option value="">Select case type</option>
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Corporate">Corporate</option>
                <option value="Family">Family</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Intellectual Property">Intellectual Property</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="case_status"
                value={formData.case_status}
                onChange={handleChange}
                required
                className="input-field mt-1"
              >
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                name="case_priority"
                value={formData.case_priority}
                onChange={handleChange}
                required
                className="input-field mt-1"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Billed Hours
              </label>
              <input
                type="number"
                name="case_total_billed_hour"
                value={formData.case_total_billed_hour}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field mt-1"
                placeholder="0"
              />
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Members
            </label>
            
            <div className="space-y-2">
                             {formData.case_member_list.map((member, index) => {
                 const user = users.find(u => u._id === member.case_member_id);
                 return (
                   <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                     <span className="text-sm flex-1">
                       {user ? user.username : (typeof member.case_member_id === 'string' ? member.case_member_id : member.case_member_id?._id || 'Unknown')} ({member.case_member_type})
                     </span>
                     <button
                       type="button"
                       onClick={() => removeMember(index)}
                       className="text-red-600 hover:text-red-800"
                     >
                       Remove
                     </button>
                   </div>
                 );
               })}
            </div>

            <div className="flex space-x-2 mt-2">
              <select
                value={newMember.case_member_id}
                onChange={(e) => {
                  const selectedUser = users.find(user => user._id === e.target.value);
                  setNewMember({
                    ...newMember, 
                    case_member_id: e.target.value,
                    case_member_type: selectedUser?.type || 'associates'
                  });
                }}
                className="input-field flex-1"
              >
                                 <option value="">Select a user</option>
                 {users.map(user => (
                   <option key={user._id} value={user._id}>
                     {user.username || 'Unknown'} ({user.type || 'Unknown'})
                   </option>
                 ))}
              </select>
              <select
                value={newMember.case_member_type}
                onChange={(e) => setNewMember({...newMember, case_member_type: e.target.value})}
                className="input-field w-32"
              >
                <option value="admin">Admin</option>
                <option value="partner">Partner</option>
                <option value="associates">Associate</option>
                <option value="paralegal">Paralegal</option>
                <option value="client">Client</option>
              </select>
              <button
                type="button"
                onClick={addMember}
                disabled={!newMember.case_member_id}
                className="btn-secondary"
              >
                Add
              </button>
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
              disabled={createCaseMutation.isLoading || updateCaseMutation.isLoading}
              className="btn-primary"
            >
              {createCaseMutation.isLoading || updateCaseMutation.isLoading
                ? 'Saving...'
                : mode === 'create' ? 'Create Case' : 'Update Case'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseModal; 