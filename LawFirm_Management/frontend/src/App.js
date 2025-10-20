import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import LawyerDashboard from './pages/LawyerDashboard';
import Cases from './pages/Cases';
import Documents from './pages/Documents';

import Appointments from './pages/Appointments';
import Applications from './pages/Applications';
import ClientApplications from './pages/ClientApplications';
import CRM from './pages/CRM';
import Billing from './pages/Billing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { user } = useAuth();

  // Determine which dashboard to show based on user type
  const getDashboardComponent = () => {
    if (!user) return Dashboard;
    
    switch (user.type) {
      case 'client':
        return ClientDashboard;
      case 'lawyer':
        return LawyerDashboard;
      case 'admin':
        return Dashboard;
      default:
        return Dashboard;
    }
  };

  const DashboardComponent = getDashboardComponent();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardComponent />} />
          <Route path="cases" element={<Cases />} />
          <Route path="documents" element={<Documents />} />

          <Route path="appointments" element={<Appointments />} />
          <Route path="billing" element={<Billing />} />
          <Route path="applications" element={<Applications />} />
          <Route path="client-applications" element={<ClientApplications />} />
          <Route path="crm" element={<CRM />} />
        </Route>
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App; 