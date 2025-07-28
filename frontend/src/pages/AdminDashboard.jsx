// frontend/src/pages/AdminDashboard.jsx

import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = async () => {
    await logout();                    // clears cookie + localStorage
    navigate('/', { replace: true }); // back to landing page
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{
        width: 200,
        padding: 20,
        background: '#f4f4f4',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3>Admin</h3>
        <ul style={{ listStyle: 'none', padding: 0, flex: 1 }}>
          <li><Link to="users">Users</Link></li>
          <li><Link to="kyc">KYC</Link></li>
          <li><Link to="withdrawals">Withdrawals</Link></li>
          <li><Link to="transactions">Transactions</Link></li>
          <li><Link to="videos">Videos</Link></li>
        </ul>
        <button
          onClick={handleLogout}
          style={{
            marginTop: 'auto',
            padding: '8px 12px',
            background: 'tomato',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </nav>
      <main style={{ flex: 1, padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
}