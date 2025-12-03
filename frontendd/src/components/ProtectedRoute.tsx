import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation(); // Keep track of the route the user was trying to access

  // Show a loader while authentication state is being determined
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If user is authenticated, render the requested page
  if (user) {
    return <Outlet />;
  }

  // If not authenticated, redirect to login and preserve the target location
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;