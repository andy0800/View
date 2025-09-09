// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api';

const AuthContext = createContext();

// Session checking disabled to prevent 401 errors

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false to prevent loading state
  const sessionChecked = useRef(false);

  // ✅ Disabled automatic session checking to prevent 401 errors
  useEffect(() => {
    console.log('AuthContext: Skipping automatic session check to prevent 401 errors');
    setLoading(false);
    
    // Check if user data exists in localStorage from previous session
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('AuthContext: Found stored user data:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.log('AuthContext: No valid stored user data');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
    }
  }, []); // Empty dependency array - only runs once

  // ✅ Save user/token and set state
  const persist = ({ user: usr, token }) => {
    try {
      console.log('AuthContext: Persisting user:', usr);
      localStorage.setItem('user', JSON.stringify(usr));
      // Do not persist token; rely on httpOnly cookie
      setUser(usr);
    } catch (err) {
      console.error('❌ Failed to persist user/token:', err);
    }
  };

  // ✅ Logout clears both local and server session
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('⚠️ Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      setUser(null);
    }
  };

  // Computed authentication status
  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider value={{ user, persist, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}