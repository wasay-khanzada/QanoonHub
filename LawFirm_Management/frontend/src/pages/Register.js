import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    number: '',
    address: '',
    type: 'client',
    specializations: [],
    credentials: {
      barNumber: '',
      licenseNumber: '',
      yearsOfExperience: '',
      education: '',
      certifications: []
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newCertification, setNewCertification] = useState('');

  const navigate = useNavigate();

  const registerMutation = useMutation(
    async (data) => {
      const response = await axios.post('/auth/register', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        navigate('/login');
      },
      onError: (error) => {
        toast.error(error.response?.data?.err || 'Registration failed');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Prepare data for submission
    const submitData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      number: formData.number,
      address: formData.address,
      type: formData.type
    };

    // Add lawyer-specific data if registering as lawyer
    if (formData.type === 'lawyer') {
      submitData.specializations = formData.specializations;
      submitData.credentials = {
        ...formData.credentials,
        yearsOfExperience: parseInt(formData.credentials.yearsOfExperience) || 0
      };
    }

    registerMutation.mutate(submitData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSpecializationChange = (specialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleCredentialChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          certifications: [...prev.credentials.certifications, newCertification.trim()]
        }
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        certifications: prev.credentials.certifications.filter((_, i) => i !== index)
      }
    }));
  };

  const specializations = [
    'Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law', 
    'Real Estate Law', 'Intellectual Property', 'Tax Law', 'Environmental Law'
  ];

  return (
    <div className="min-h-screen bg-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">⚖️</span>
            <h1 className="text-3xl font-bold text-primary-600">QanoonHub</h1>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-secondary-300">
            Join the Law Firm Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-secondary-700 p-6 rounded-lg border border-secondary-600">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-200 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-200 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-200 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-200 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                placeholder="Enter address"
              />
            </div>
          </div>

          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-2">
              User Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="client"
                  checked={formData.type === 'client'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-secondary-200">Client</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="lawyer"
                  checked={formData.type === 'lawyer'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-secondary-200">Lawyer</span>
              </label>
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400 pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-secondary-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400 pr-10"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-secondary-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lawyer-specific fields */}
          {formData.type === 'lawyer' && (
            <div className="space-y-4 border-t border-secondary-600 pt-4">
              <h3 className="text-lg font-medium text-white">Lawyer Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Bar Number
                  </label>
                  <input
                    type="text"
                    value={formData.credentials.barNumber}
                    onChange={(e) => handleCredentialChange('barNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                    placeholder="Enter bar number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={formData.credentials.licenseNumber}
                    onChange={(e) => handleCredentialChange('licenseNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                    placeholder="Enter license number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={formData.credentials.yearsOfExperience}
                    onChange={(e) => handleCredentialChange('yearsOfExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                    placeholder="Enter years of experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-200 mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    value={formData.credentials.education}
                    onChange={(e) => handleCredentialChange('education', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                    placeholder="Enter education details"
                  />
                </div>
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-2">
                  Specializations
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {specializations.map((spec) => (
                    <label key={spec} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={() => handleSpecializationChange(spec)}
                        className="mr-2"
                      />
                      <span className="text-sm text-secondary-200">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-secondary-200 mb-2">
                  Certifications
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    className="flex-1 px-3 py-2 border border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 bg-secondary-800 text-white placeholder-secondary-400"
                    placeholder="Add certification"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.credentials.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary-800 p-2 rounded">
                      <span className="text-secondary-200">{cert}</span>
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={registerMutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {registerMutation.isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-secondary-300">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 