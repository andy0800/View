// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Hydrate user on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Persist user object (token is in cookie)
  const persist = usr => {
    localStorage.setItem('user', JSON.stringify(usr));
    setUser(usr);
  };

  // Logout: calls API to clear cookie, then clear user
  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, persist, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}