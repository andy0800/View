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
import { keyframes } from '@mui/material/styles';
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

  const fontStack = '"Inter", "Poppins", "Cairo", "Noto Sans Arabic", "Roboto", "Helvetica", "Arial", sans-serif';

  const glow = keyframes`
    0% { box-shadow: 0 0 0 rgba(25, 118, 210, 0.0); }
    100% { box-shadow: 0 18px 45px rgba(25, 118, 210, 0.25); }
  `;

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
    <Box
      dir={isRTL ? 'rtl' : 'ltr'}
      sx={{ 
        width: 296,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f1a2b 0%, #0b1320 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at top, rgba(25,118,210,0.25), transparent 55%)',
          pointerEvents: 'none'
        }}
      />
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        textAlign: isRTL ? 'right' : 'left',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isRTL ? 'flex-end' : 'flex-start',
          mb: 1.5,
          gap: 1
        }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: 'rgba(25,118,210,0.2)',
              color: 'primary.main'
            }}
          >
            <VideoLibrary />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: fontStack }}>
            {t('viewer.view')}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: fontStack }}>
          {t('viewer.viewerDashboard')}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, p: 2, position: 'relative' }}>
        {navigationItems.map((item) => (
          <ListItem
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              mb: 1,
              borderRadius: 2.5,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.03)',
              textDecoration: 'none',
              transition: 'all 180ms ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.08)',
                transform: 'translateY(-1px)'
              },
              '&.active': {
                backgroundColor: 'rgba(25,118,210,0.25)',
                borderLeft: isRTL ? 'none' : '4px solid #1976d2',
                borderRight: isRTL ? '4px solid #1976d2' : 'none',
                animation: `${glow} 260ms ease`
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
              primaryTypographyProps={{ fontWeight: 600, fontFamily: fontStack }}
              secondaryTypographyProps={{ fontSize: '0.75rem', opacity: 0.8, fontFamily: fontStack }}
            />
          </ListItem>
        ))}
      </Box>

      {/* User Info & Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Language Switcher for Mobile */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
          <LanguageSwitcher variant="button" />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0, bgcolor: 'rgba(25,118,210,0.2)', color: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: fontStack }}>
              {user?.name || t('viewer.viewer')}
            </Typography>
            <Chip 
              label={t('profile.viewerAccount')} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.12)', 
                color: 'white',
                fontSize: '0.7rem',
                fontFamily: fontStack
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
            borderColor: 'rgba(255,255,255,0.25)',
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.6)',
              backgroundColor: 'rgba(255,255,255,0.08)'
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
            width: 296,
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
              width: 296,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #0f1a2b 0%, #0b1320 100%)',
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
          ml: { xs: 0, md: isRTL ? 0 : '296px' },
          mr: { xs: 0, md: isRTL ? '296px' : 0 },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top App Bar */}
        <AppBar 
          position="sticky" 
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.88)',
            color: 'text.primary',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(14px)',
            zIndex: 1100
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
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
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <VideoLibrary sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontFamily: fontStack }}>
                {t('viewer.viewerDashboard')}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {!isMobile && (
              <Chip
                icon={<MonetizationOn />}
                label={t('viewer.earnCredits')}
                sx={{
                  bgcolor: 'rgba(25,118,210,0.1)',
                  color: 'primary.main',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontFamily: fontStack
                }}
              />
            )}

            {/* Credit Balance Display */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CreditBar />
            </Box>

            {/* Language Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSwitcher variant="icon" />
            </Box>

            {/* User Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0) || 'V'}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: fontStack }}>
                {user?.name || t('viewer.viewer')}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}