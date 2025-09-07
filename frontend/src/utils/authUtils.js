// frontend/src/utils/authUtils.js
// Authentication utility functions

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Basic token validation (check if it's not empty and has proper format)
    if (token.length < 10) return false;
    
    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      console.log('🔐 Token expired, clearing...');
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('🔐 Invalid token format, clearing...');
    localStorage.removeItem('token');
    return false;
  }
};

/**
 * Get current user info from token
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      role: payload.role,
      name: payload.name
    };
  } catch (error) {
    console.log('🔐 Error parsing token:', error);
    return null;
  }
};

/**
 * Clear authentication and redirect to login
 */
export const logout = () => {
  console.log('🔐 Logging out user...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Validate and refresh authentication status
 * @returns {boolean}
 */
export const validateAuth = () => {
  if (!isAuthenticated()) {
    // Don't auto-logout - just return false
    // This prevents infinite loops when auth validation fails
    console.log('🔐 Authentication validation failed - not auto-logging out');
    return false;
  }
  
  return true;
};
