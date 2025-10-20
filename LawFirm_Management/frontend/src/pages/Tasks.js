import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery('tasks', async () => {
    const response = await axios.get('/api/tasks/user');
    return response.data;
  });

  const updateStatusMutation = useMutation(
    async ({ taskId, status }) => {
      await axios.put(`/api/tasks/updateStatus/${status}`, { _id: taskId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        toast.success('Task status updated successfully');
      },
      onError: () => {
        toast.error('Failed to update task status');
      },
    }
  );

  const handleStatusUpdate = (taskId, newStatus) => {
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'text-secondary-400 bg-secondary-200';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'done': return 'text-green-600 bg-green-100';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo': return <ClockIcon className="h-4 w-4" />;
      case 'in_progress': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'done': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-secondary-300">Manage your assigned tasks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-secondary-700 p-4 rounded-lg shadow-sm border border-secondary-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-secondary-200 mb-1">
              Search Tasks
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
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
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 text-sm text-secondary-300 border border-secondary-600 rounded-md hover:bg-secondary-600 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-secondary-700 rounded-lg shadow-sm border border-secondary-600">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No tasks found</h3>
            <p className="mt-1 text-sm text-secondary-300">
              {searchTerm || statusFilter !== 'all' 
                ? 'No tasks match your current filters.'
                : 'No tasks have been assigned to you yet.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-600">
            {filteredTasks.map((task) => (
              <div key={task._id} className="p-6 hover:bg-secondary-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {task.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1 capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-secondary-300 mb-3">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-400">Priority:</span>
                        <span className="text-white ml-2 capitalize">{task.priority || 'Medium'}</span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Due Date:</span>
                        <span className="text-white ml-2">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-secondary-400">Assigned by:</span>
                        <span className="text-white ml-2">{task.assigned_by?.username || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {task.status !== 'done' && (
                      <button
                        onClick={() => handleStatusUpdate(task._id, 'done')}
                        className="p-2 text-green-400 hover:text-green-300"
                        title="Mark as Done"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                    {task.status === 'todo' && (
                      <button
                        onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                        className="p-2 text-orange-400 hover:text-orange-300"
                        title="Start Task"
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate(task._id, 'todo')}
                        className="p-2 text-secondary-400 hover:text-secondary-200"
                        title="Pause Task"
                      >
                        <ClockIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks; 