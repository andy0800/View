import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  VideoLibrary,
  AccountBalance,
  Person,
  Business,
  Settings,
  Notifications,
  Logout,
  ChevronLeft,
  Home,
  Analytics,
  Payment,
  Campaign
} from '@mui/icons-material';

const ResponsiveDashboard = ({
  title = 'Dashboard',
  user,
  navigationItems = [],
  children,
  variant = 'default', // 'default', 'admin', 'advertiser', 'viewer'
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'admin':
        return {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        };
      case 'advertiser':
        return {
          background: 'linear-gradient(135deg, #ff6b35 0%, #e64a19 100%)',
          color: 'white'
        };
      case 'viewer':
        return {
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        };
    }
  };

  const drawerWidth = 280;

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          ...getVariantStyles(),
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            mb: 2,
            backgroundColor: 'rgba(255,255,255,0.2)'
          }}
        >
          {variant === 'admin' && <Dashboard />}
          {variant === 'advertiser' && <Business />}
          {variant === 'viewer' && <VideoLibrary />}
          {variant === 'default' && <Home />}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
          {title}
        </Typography>
        {user && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {user.name || user.email}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={item.onClick}
              sx={{
                mx: 2,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.16)'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{ fontWeight: 'medium' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
              {item.badge && (
                <Badge
                  badgeContent={item.badge}
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 'auto' }} />

      {/* Footer Actions */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              mx: 2,
              mb: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'white'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', ...sx }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          ...getVariantStyles()
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {title}
          </Typography>

          {/* User Info */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit">
                  <Badge badgeContent={4} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Chip
                label={user.name || user.email}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0,0,0,0.08)'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar height
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ResponsiveDashboard;
