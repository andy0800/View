// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api';

const AuthContext = createContext();

// Global flag to prevent multiple session checks across the entire app
let globalSessionChecked = false;

// Emergency disable flag - completely prevents session checking
let emergencyDisable = false;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false to prevent loading state
  const sessionChecked = useRef(false);

  // ✅ Only check session ONCE across the entire app, never again
  useEffect(() => {
    const checkSession = async () => {
      // Emergency disable - completely prevent session checking
      if (emergencyDisable) {
        console.log('AuthContext: Emergency disabled - no session checking');
        setLoading(false);
        return;
      }

      // Prevent multiple session checks globally
      if (globalSessionChecked || sessionChecked.current) {
        console.log('AuthContext: Already checked - skipping');
        setLoading(false);
        return;
      }

      console.log('AuthContext: Checking session ONCE globally...');
      
      try {
        const { data } = await api.get('/auth/session');
        console.log('AuthContext: Session data received:', data);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.sessionId) {
          localStorage.setItem('sessionId', data.sessionId);
        }
      } catch (error) {
        console.log('AuthContext: No valid session found:', error.message);
        // Clear any stale data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        setUser(null);
      } finally {
        setLoading(false);
        sessionChecked.current = true; // Mark as checked locally
        globalSessionChecked = true; // Mark as checked globally
        emergencyDisable = true; // Emergency disable after first check
        console.log('AuthContext: Session check completed globally, emergency disabled');
      }
    };

    // Check session immediately but only once globally
    checkSession();
  }, []); // Empty dependency array - only runs once

  // ✅ Save user/token and set state
  const persist = ({ user: usr, token }) => {
    try {
      console.log('AuthContext: Persisting user:', usr);
      localStorage.setItem('user', JSON.stringify(usr));
      // Do not persist token; rely on httpOnly cookie
      setUser(usr);
      sessionChecked.current = true; // Mark as checked
      globalSessionChecked = true; // Mark as checked globally
      emergencyDisable = true; // Emergency disable
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
      // No token in localStorage anymore
      localStorage.removeItem('sessionId');
      setUser(null);
      sessionChecked.current = false; // Allow session check on next login
      globalSessionChecked = false; // Allow session check on next login
      emergencyDisable = false; // Allow session check on next login
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