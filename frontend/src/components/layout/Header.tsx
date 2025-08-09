import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { state, logout } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="/" className="block">
                <img 
                  src="/assets/logos/full-logo-8.png" 
                  alt="Food & Friends Logo" 
                  className="h-12 w-auto hover:opacity-80 transition-opacity"
                />
              </a>
            </div>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              <a
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-gray-800 text-white shadow-md' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Book
              </a>
              <a
                href="/about"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/about') 
                    ? 'bg-gray-800 text-white shadow-md' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                About
              </a>
              {state.isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <a
                    href="/profile"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/profile') 
                        ? 'bg-gray-800 text-white shadow-md' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Profile
                  </a>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/login') 
                      ? 'bg-gray-800 text-white shadow-md' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Login
                </a>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 