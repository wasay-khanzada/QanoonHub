import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationPanel from './NotificationPanel';

const Header = () => {
  const { user } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <header className="bg-secondary-700 shadow-sm border-b border-secondary-600">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-white">
            Welcome back, {user?.name || 'User'}!
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notification button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-secondary-300 hover:text-white rounded-lg hover:bg-secondary-600"
            >
              <BellIcon className="h-6 w-6" />
            </button>
            
            {/* Notification panel */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-secondary-700 rounded-lg shadow-lg border border-secondary-600 z-50">
                <NotificationPanel />
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-secondary-300 capitalize">
                {user?.type || 'user'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 