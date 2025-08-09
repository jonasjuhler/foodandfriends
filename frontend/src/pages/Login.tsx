import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from '../components/auth/GoogleLogin';

const Login: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();

  // Redirect to booking page if already authenticated
  if (state.isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to Food & Friends
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our festival and book your spot!
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <GoogleLogin />
        </div>
      </div>
    </div>
  );
};

export default Login; 