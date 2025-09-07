import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import {
  Menu,
  Home,
  VideoLibrary,
  AccountBalance,
  Person,
  Business,
  Dashboard,
  Logout,
  Close
} from '@mui/icons-material';

const ResponsiveNavigation = ({
  title = 'View',
  user,
  navigationItems = [],
  onLogout,
  onNavigate,
  variant = 'default', // 'default', 'viewer', 'advertiser', 'admin'
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    onNavigate?.(path);
    setMobileOpen(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'viewer':
        return {
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white'
        };
      case 'advertiser':
        return {
          background: 'linear-gradient(135deg, #ff6b35 0%, #e64a19 100%)',
          color: 'white'
        };
      case 'admin':
        return {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        };
    }
  };

  const drawer = (
    <Box sx={{ width: 280, height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          ...getVariantStyles(),
          textAlign: 'center'
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            mx: 'auto',
            mb: 2,
            backgroundColor: 'rgba(255,255,255,0.2)'
          }}
        >
          {variant === 'viewer' && <VideoLibrary />}
          {variant === 'advertiser' && <Business />}
          {variant === 'admin' && <Dashboard />}
          {variant === 'default' && <Home />}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
          {title}
        </Typography>
        {user && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
            {user.name || user.email}
          </Typography>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => (
          <ListItem
            key={item.path}
            button
            onClick={() => handleNavigation(item.path)}
            sx={{
              mx: 2,
              mb: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              secondary={item.description}
              primaryTypographyProps={{ fontWeight: 'medium' }}
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </ListItem>
        ))}

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Logout */}
        <ListItem
          button
          onClick={onLogout}
          sx={{
            mx: 2,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'white'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {/* App Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          ...getVariantStyles(),
          ...sx
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {title}
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {user && (
                <Chip
                  label={user.name || user.email}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}

              <Button
                color="inherit"
                onClick={onLogout}
                startIcon={<Logout />}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280
          }
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default ResponsiveNavigation;
