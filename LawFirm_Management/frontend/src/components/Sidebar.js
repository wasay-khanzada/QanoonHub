import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  FolderIcon,
  CheckCircleIcon,
  CalendarIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // Navigation items based on user type
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ];

    switch (user?.type) {
      case 'client':
        return [
          ...baseItems,
          { name: 'My Cases', href: '/cases', icon: DocumentTextIcon },
          { name: 'Documents', href: '/documents', icon: FolderIcon },
          { name: 'My Appointments', href: '/appointments', icon: CalendarIcon },
          { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
        ];
      case 'lawyer':
        return [
          ...baseItems,
          { name: 'Available Cases', href: '/cases', icon: DocumentTextIcon },
          { name: 'Documents', href: '/documents', icon: FolderIcon },
          { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
          { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
        ];
      case 'admin':
        return [
          ...baseItems,
          { name: 'Cases', href: '/cases', icon: DocumentTextIcon },
          { name: 'Documents', href: '/documents', icon: FolderIcon },
          { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
          { name: 'Billing', href: '/billing', icon: CurrencyDollarIcon },
          { name: 'CRM', href: '/crm', icon: UsersIcon },
        ];
      default:
        return baseItems;
    }
  };

  const navigation = getNavigationItems();

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-secondary-300 hover:text-secondary-200"
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-secondary-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-secondary-600">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚖️</span>
              <h1 className="text-xl font-bold text-primary-600">QanoonHub</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-200 hover:bg-secondary-700 hover:text-white'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="px-4 py-4 border-t border-secondary-600">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-secondary-300 capitalize">
                  {user?.type || 'user'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-secondary-300 hover:bg-secondary-700 hover:text-white rounded-lg transition-colors"
            >
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar; 