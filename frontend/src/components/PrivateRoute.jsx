import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

// Emergency disable flag for PrivateRoute
let privateRouteDisabled = false;

export default function PrivateRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Emergency disable - completely bypass authentication
  if (privateRouteDisabled) {
    console.log('PrivateRoute: Emergency disabled - bypassing authentication');
    return children;
  }

  // Check localStorage as fallback if user not in context yet
  const storedUser = !user ? (() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  })() : user;

  console.log('PrivateRoute check:', { 
    user, 
    storedUser, 
    isAuthenticated, 
    loading,
    pathname: location.pathname 
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Use storedUser as fallback if context user not yet available
  const currentUser = user || storedUser;

  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log('PrivateRoute: No user found, redirecting to /');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    console.log(`PrivateRoute: Role mismatch - required: ${allowedRoles}, user has: ${currentUser.role}`);
    
    // Redirect to appropriate dashboard based on user role
    if (currentUser.role === 'viewer') {
      return <Navigate to="/viewer" replace />;
    } else if (currentUser.role === 'advertiser') {
      return <Navigate to="/advertiser" replace />;
    } else if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Fallback to home page
    return <Navigate to="/" replace />;
  }

  console.log('PrivateRoute: Access granted');
  // User is authenticated and has required role
  return children;
}

// Function to disable PrivateRoute globally
export function disablePrivateRoute() {
  privateRouteDisabled = true;
  console.log('PrivateRoute: Emergency disabled globally');
}

// Function to enable PrivateRoute globally
export function enablePrivateRoute() {
  privateRouteDisabled = false;
  console.log('PrivateRoute: Emergency enabled globally');
}