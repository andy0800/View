// frontend/src/pages/AdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import api                  from '../api';
import { useAuth }          from '../contexts/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { persist } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  // ← Define handleSubmit **inside** the component
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post('/auth/admin-login', {
        username,
        password
      });
      // Persist user (cookie is set by server)
      persist(data.user);
      navigate('/admin/users', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: 'auto', padding: 20 }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}