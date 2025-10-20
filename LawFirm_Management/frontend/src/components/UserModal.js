import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const UserModal = ({ isOpen, onClose, mode = 'create', userData = null }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    number: '',
    address: '',
    type: 'client'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    if (mode === 'edit' && userData) {
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        password: '',
        number: userData.number || '',
        address: userData.address || '',
        type: userData.type || 'client'
      });
    }
  }, [mode, userData]);

  const createUserMutation = useMutation(
    async (data) => {
      await axios.post('/api/crm', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        queryClient.invalidateQueries('employees');
        toast.success('User created successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create user');
      },
    }
  );

  const updateUserMutation = useMutation(
    async (data) => {
      await axios.put(`/api/crm/${userData._id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients');
        queryClient.invalidateQueries('employees');
        toast.success('User updated successfully');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update user');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'create' && formData.password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (mode === 'create' && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (mode === 'create') {
      createUserMutation.mutate(formData);
    } else {
      const { password, ...updateData } = formData;
      updateUserMutation.mutate(updateData);
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
      username: '',
      email: '',
      password: '',
      number: '',
      address: '',
      type: 'client'
    });
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field mt-1"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field mt-1"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {mode === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-field mt-1"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="number"
                value={formData.number}
                onChange={handleChange}
                required
                className="input-field mt-1"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                User Role
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="input-field mt-1"
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
                <option value="partner">Partner</option>
                <option value="associates">Associate</option>
                <option value="paralegal">Paralegal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="input-field mt-1"
              placeholder="Enter address"
            />
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
              disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
              className="btn-primary"
            >
              {createUserMutation.isLoading || updateUserMutation.isLoading
                ? 'Saving...'
                : mode === 'create' ? 'Create User' : 'Update User'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal; 