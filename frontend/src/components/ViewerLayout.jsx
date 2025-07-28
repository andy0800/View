import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ViewerLayout() {
  const { logout } = useAuth();
  const nav = useNavigate();

  const links = [
    { to: '/viewer',        label: 'Home'    },
    { to: '/viewer/wallet', label: 'Wallet'  },
    { to: '/viewer/profile',label: 'Profile' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <nav style={{ background: '#222', padding: '0.5rem', display: 'flex' }}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            style={({ isActive }) => ({
              marginRight: '1rem',
              color: isActive ? '#0f0' : '#fff',
              textDecoration: 'none'
            })}
          >
            {l.label}
          </NavLink>
        ))}

        <button
          onClick={() => { logout(); nav('/', { replace: true }); }}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid #fff',
            color: '#fff',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </nav>

      <main style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}