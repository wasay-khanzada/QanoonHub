import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  FolderIcon, 
  DocumentIcon, 
  CheckCircleIcon, 
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery('dashboardStats', async () => {
    const response = await axios.get('/api/statistics/dashboard');
    return response.data;
  });

  const COLORS = ['#D4A857', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-primary-600 bg-primary-100';
      case 'Closed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'partner': return 'text-primary-600 bg-primary-100';
      case 'associates': return 'text-green-600 bg-green-100';
      case 'paralegal': return 'text-orange-600 bg-orange-100';
      case 'client': return 'text-secondary-400 bg-secondary-200';
      default: return 'text-secondary-400 bg-secondary-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare case status chart data
  const caseData = [
    { name: 'Open', value: stats?.openCases || 0, color: '#D4A857' },
    { name: 'Assigned', value: stats?.assignedCases || 0, color: '#3B82F6' },
    { name: 'In Progress', value: stats?.inProgressCases || 0, color: '#F59E0B' },
    { name: 'Completed', value: stats?.completedCases || 0, color: '#10B981' },
    { name: 'Closed', value: stats?.closedCases || 0, color: '#6B7280' },
  ];
  const userData = [
    { name: 'Total Users', value: stats?.totalUsers || 0 },
    { name: 'Clients', value: stats?.totalClients || 0 },
    { name: 'Lawyers', value: stats?.totalLawyers || 0 },
    { name: 'Admins', value: stats?.totalAdmins || 0 },
  ];

  const activityData = [
    { name: 'Jan', uploads: 5, requests: 3, interactions: 15 },
    { name: 'Feb', uploads: 3, requests: 5, interactions: 5 },
    { name: 'Mar', uploads: 8, requests: 6, interactions: 18 },
    { name: 'Apr', uploads: 3, requests: 9, interactions: 10 },
    { name: 'May', uploads: 4, requests: 6, interactions: 9 },
    { name: 'Jun', uploads: 3, requests: 5, interactions: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-secondary-300">Overview of your law firm's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-300">Total Cases</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalCases || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-300">Documents</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalDocuments || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-300">Total Users</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-300">Clients</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalClients || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Case Status Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Case Status</h3>
        <PieChart width={300} height={200}>
          <Pie
            data={caseData}
            cx={150}
            cy={100}
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {caseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <div className="flex justify-between mt-4">
          {caseData.map((entry, idx) => (
            <div key={entry.name} className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-white text-sm">{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      </div>

        {/* User Distribution Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
          <BarChart width={300} height={200} data={userData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Bar dataKey="value" fill="#D4A857" />
          </BarChart>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Activity</h3>
        <LineChart width={800} height={300} data={activityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="uploads" stroke="#D4A857" strokeWidth={2} />
          <Line type="monotone" dataKey="requests" stroke="#10B981" strokeWidth={2} />
          <Line type="monotone" dataKey="interactions" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </div>
    </div>
  );
};

export default Dashboard; 