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
import { ThemeProvider, CssBaseline } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import CreditBar from './CreditBar';
import LanguageSwitcher from './LanguageSwitcher';
import viewerTheme from '../theme/viewerTheme';
import { fadeIn, motionTokens } from '../theme/motion';

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
      backgroundColor: 'background.paper',
      backdropFilter: 'blur(14px)',
      boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      color: 'text.primary',
      borderRight: isRTL ? 'none' : '1px solid rgba(255,255,255,0.06)',
      borderLeft: isRTL ? '1px solid rgba(255,255,255,0.06)' : 'none'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2
        }}>
          <VideoLibrary sx={{ fontSize: 32, mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {t('viewer.view')}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': {
                backgroundColor: 'rgba(229,9,20,0.08)',
                transform: 'translateX(2px)'
              },
              '&.active': {
                backgroundColor: 'rgba(229,9,20,0.16)',
                borderLeft: isRTL ? 'none' : '4px solid #E50914',
                borderRight: isRTL ? '4px solid #E50914' : 'none',
              }
            }}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
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
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Language Switcher for Mobile */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
          <LanguageSwitcher variant="button" />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0, bgcolor: 'rgba(229,9,20,0.2)', color: 'primary.main' }}>
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
                bgcolor: 'rgba(229,9,20,0.15)', 
                color: 'primary.main',
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
            color: 'text.primary', 
            borderColor: 'rgba(255,255,255,0.2)',
            '&:hover': {
              borderColor: 'rgba(229,9,20,0.8)',
              backgroundColor: 'rgba(229,9,20,0.08)'
            }
          }}
        >
          {t('common.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={viewerTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
                backgroundColor: 'background.paper',
                backdropFilter: 'blur(16px)',
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
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(15,17,23,0.75)'
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
              
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
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
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: motionTokens.normal, ease: motionTokens.ease }}
            style={{ flex: 1 }}
          >
            <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
              <Outlet />
            </Box>
          </motion.div>
        </Box>
      </Box>
    </ThemeProvider>
  );
}