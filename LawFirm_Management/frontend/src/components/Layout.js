import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotWidget from './ChatbotWidget';

const Layout = () => {
  return (
    <div className="flex h-screen bg-secondary-800">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default Layout; 