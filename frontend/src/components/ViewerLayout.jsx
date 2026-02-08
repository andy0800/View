import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import { 
  Home, 
  AccountBalance, 
  Person, 
  Menu,
  Logout,
  VideoLibrary,
  MonetizationOn
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import CreditBar from './CreditBar';
import LanguageSwitcher from './LanguageSwitcher';

export default function ViewerLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Debug mobile state
  console.log('ViewerLayout - isMobile:', isMobile, 'mobileOpen:', mobileOpen, 'isRTL:', isRTL);

  const navigationItems = [
    { 
      to: '/viewer', 
      label: t('navigation.home'), 
      icon: <Home />,
      description: t('viewer.browseSections'),
      color: 'primary'
    },
    { 
      to: '/credits', 
      label: t('navigation.credits'), 
      icon: <AccountBalance />,
      description: t('viewer.earnCredits'),
      color: 'success'
    },
    { 
      to: '/profile', 
      label: t('navigation.profile'), 
      icon: <Person />,
      description: t('profile.subtitle'),
      color: 'info'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    console.log('Toggle mobile menu:', !mobileOpen);
  };

  const drawer = (
    <Box sx={{ 
      width: 280,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2
        }}>
          <VideoLibrary sx={{ fontSize: 32, mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('viewer.view')}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {t('viewer.viewerDashboard')}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, p: 2 }}>
        {navigationItems.map((item) => (
          <ListItem
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              mb: 1,
              borderRadius: 2,
              color: 'white',
              textDecoration: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              '&.active': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderLeft: isRTL ? 'none' : '4px solid white',
                borderRight: isRTL ? '4px solid white' : 'none',
              }
            }}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              secondary={item.description}
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.75rem', opacity: 0.8 }}
            />
          </ListItem>
        ))}
      </Box>

      {/* User Info & Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Language Switcher for Mobile */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
          <LanguageSwitcher variant="button" />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.name || t('viewer.viewer')}
            </Typography>
            <Chip 
              label={t('profile.viewerAccount')} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: '0.7rem'
              }} 
            />
          </Box>
        </Box>
        
        <Button
          fullWidth
          variant="outlined"
          onClick={handleLogout}
          startIcon={isRTL ? null : <Logout />}
          endIcon={isRTL ? <Logout /> : null}
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {t('common.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Navigation */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: 280,
            flexShrink: 0,
            position: 'fixed',
            height: '100vh',
            zIndex: 1200,
            right: isRTL ? 0 : 'auto',
            left: isRTL ? 'auto' : 0
          }}
        >
          {drawer}
        </Box>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          anchor={isRTL ? 'right' : 'left'}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: 280,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
              zIndex: 1300
            }
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: isRTL ? 0 : '280px' },
          mr: { xs: 0, md: isRTL ? '280px' : 0 },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top App Bar */}
        <AppBar 
          position="sticky" 
          sx={{ 
            bgcolor: 'white',
            color: 'text.primary',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1100
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge={isRTL ? 'end' : 'start'}
                onClick={handleDrawerToggle}
                sx={{ mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0, display: { xs: 'flex', md: 'none' } }}
              >
                <Menu />
              </IconButton>
            )}
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('viewer.viewerDashboard')}
            </Typography>

            {/* Credit Balance Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <CreditBar />
            </Box>

            {/* Language Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <LanguageSwitcher variant="icon" />
            </Box>

            {/* User Info */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0) || 'V'}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name || t('viewer.viewer')}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}