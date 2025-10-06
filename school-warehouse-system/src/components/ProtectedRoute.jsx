import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, allowedRoles }) => {
  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is not specified, allow access
  if (!allowedRoles) {
    return children;
  }

  // Check if user's role is in allowedRoles
  if (allowedRoles.includes(user.role)) {
    return children;
  }

  // If user's role is not allowed, redirect to appropriate dashboard
  return <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;