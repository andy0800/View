import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button } from '@mui/material';

export default function AdvertiserLayout() {
  const { logout } = useAuth();
  const nav = useNavigate();

  const links = [
    { to: '/advertiser/ads',      label: 'Published Ads' },
    { to: '/advertiser/activate', label: 'Activate Ad'    },
    { to: '/advertiser/packages', label: 'Buy Package'    },
    { to: '/advertiser/credit',   label: 'Manage Credit'  },
    { to: '/advertiser/profile',  label: 'Profile'        }
  ];

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box
        component="nav"
        sx={{
          backgroundColor: '#333',
          p: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            style={({ isActive }) => ({
              color: isActive ? '#0f0' : '#fff',
              textDecoration: 'none',
              marginRight: '1rem'
            })}
          >
            {l.label}
          </NavLink>
        ))}

        <Button
          variant="outlined"
          sx={{ color: '#fff', borderColor: '#fff', marginLeft: 'auto' }}
          onClick={() => {
            logout();
            nav('/', { replace: true });
          }}
        >
          Logout
        </Button>
      </Box>

      <Box component="main" sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}