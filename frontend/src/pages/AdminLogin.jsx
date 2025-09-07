// frontend/src/pages/AdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function AdminLogin() {
  const { persist } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/admin-login', {
        username,
        password
      });

      // Admin login returns user data; cookie holds the token
      persist({ user: data.user });
      
      // Navigate to admin dashboard instead of /admin (which is the login page)
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '100px auto', 
      padding: 20,
      border: '1px solid #ddd',
      borderRadius: 8
    }}>
      <h2>{t('admin.adminLogin')}</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="text"
          placeholder={t('admin.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder={t('admin.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? t('admin.loggingIn') : t('admin.login')}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}