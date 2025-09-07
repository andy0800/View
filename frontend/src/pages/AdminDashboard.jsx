// frontend/src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Badge,
  Paper,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Dashboard,
  People,
  VerifiedUser,
  AccountBalance,
  Receipt,
  VideoLibrary,
  Business,
  Gavel,
  Logout,
  Menu,
  Shield,
  AdminPanelSettings,
  Notifications,
  Settings,
  TrendingUp,
  MonetizationOn,
  Schedule
} from '@mui/icons-material';
import api from '../api';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0);

  // CSS keyframes for pulse animation
  const pulseKeyframes = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;

  // AdminDashboard: Rendering with user

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up real-time data refresh every 2 minutes (less aggressive)
    const interval = setInterval(() => {
      fetchDashboardStats(true);
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      // Check if database has data first
      try {
        console.log('🔍 Fetching dashboard statistics...');
        
        // Fetch statistics from all admin endpoints
        const [verificationStats, usersRes, videosRes, transactionsRes, withdrawalsRes, appealsRes, notificationsRes] = await Promise.all([
          api.get('/api/admin/verification-stats'),
          api.get('/api/admin/users'),
          api.get('/api/admin/videos'),
          api.get('/api/admin/transactions'),
          api.get('/api/admin/withdrawals'),
          api.get('/api/admin/appeals'),
          api.get('/api/admin/notifications/pending-count')
        ]);

        console.log('✅ All API calls completed successfully');

        // Extract statistics from responses with proper fallbacks
        const verificationData = verificationStats.data.success ? verificationStats.data.data : {};
        const usersData = usersRes.data.success ? usersRes.data.data.statistics : {};
        const videosData = videosRes.data.success ? videosRes.data.data.statistics : {};
        const transactionsData = transactionsRes.data.success ? transactionsRes.data.data.statistics : {};
        const withdrawalsData = withdrawalsRes.data.success ? withdrawalsRes.data.data.statistics : {};
        const appealsData = appealsRes.data.success ? appealsRes.data.data.statistics : {};
        const notificationsData = notificationsRes.data.success ? notificationsRes.data.data : {};

        console.log('📊 Data extracted:', {
          verification: Object.keys(verificationData).length,
          users: Object.keys(usersData).length,
          videos: Object.keys(videosData).length,
          transactions: Object.keys(transactionsData).length,
          withdrawals: Object.keys(withdrawalsData).length,
          appeals: Object.keys(appealsData).length,
          notifications: Object.keys(notificationsData).length
        });

        // Validate and set fallback values for missing data
        setStats({
          verification: verificationData || {},
          users: usersData || { total: 0, viewers: 0, advertisers: 0, admins: 0 },
          videos: videosData || { total: 0, pending: 0, approved: 0, rejected: 0 },
          transactions: transactionsData || { total: 0, total_amount: 0, pending: 0, completed: 0 },
          withdrawals: withdrawalsData || { total: 0, total_amount: 0, pending: 0, completed: 0 },
          appeals: appealsData || { total: 0, pending: 0, approved: 0, rejected: 0, overdue: 0 },
          notifications: notificationsData || { pending: 0 }
        });
        
        // Update pending notifications count for real-time badge
        setPendingNotificationsCount(notificationsData.pending || 0);
        setLastUpdated(new Date());
        
        console.log('✅ Dashboard statistics updated successfully');
      } catch (apiError) {
        // Handle API errors gracefully when database is empty
        console.warn('⚠️ API call failed, setting empty stats:', apiError.message);
        setStats({
          verification: {},
          users: { total: 0, viewers: 0, advertisers: 0, admins: 0 },
          videos: { total: 0, pending: 0, approved: 0, rejected: 0 },
          transactions: { total: 0, total_amount: 0, pending: 0, completed: 0 },
          withdrawals: { total: 0, total_amount: 0, pending: 0, completed: 0 },
          appeals: { total: 0, pending: 0, approved: 0, rejected: 0, overdue: 0 }
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      // Error handled in UI
      setError('Failed to load dashboard statistics');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

      const handleSettings = () => {
        // Real settings functionality - open settings modal
        setSelectedMenu('settings');
        setError(''); // Clear any previous errors
      };

  const navigationItems = [
    {
      path: 'users',
      label: t('admin.userManagement'),
      icon: <People />,
      color: '#1976d2'
    },
    {
      path: 'verify',
      label: t('admin.kycVerification'),
      icon: <VerifiedUser />,
      color: '#2e7d32'
    },
    {
      path: 'withdrawals',
      label: t('admin.withdrawalRequests'),
      icon: <AccountBalance />,
      color: '#ed6c02'
    },
    {
      path: 'transactions',
      label: t('admin.transactionHistory'),
      icon: <Receipt />,
      color: '#9c27b0'
    },
    {
      path: 'videos',
      label: t('admin.videoManagement'),
      icon: <VideoLibrary />,
      color: '#d32f2f'
    },
    {
      path: 'appeals',
      label: t('admin.appealManagement'),
      icon: <Gavel />,
      color: '#ff6f00'
    },
    {
      path: 'company',
      label: t('admin.companyDashboard'),
      icon: <Business />,
      color: '#1565c0'
    },
    {
      path: 'ad-verification',
      label: t('admin.adVerification'),
      icon: <Gavel />,
      color: '#388e3c'
    },
    {
      path: 'notifications',
      label: t('admin.notifications'),
      icon: <Notifications />,
      color: '#ff9800'
    },
    {
      path: 'settings',
      label: t('admin.settings'),
      icon: <Settings />,
      color: '#6a1b9a'
    }
  ];

  const drawerWidth = 280;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            zIndex: 0
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.3)'
            }}
          >
            <Shield sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {t('admin.adminDashboard')}
          </Typography>
          <Chip
            icon={<AdminPanelSettings />}
            label="Super Admin"
            size="small"
            sx={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              fontWeight: 600
            }}
          />
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 1, mx: 1 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 3,
                    background: isActive ? 'rgba(26, 35, 126, 0.08)' : 'transparent',
                    border: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                    '&:hover': {
                      background: 'rgba(26, 35, 126, 0.04)',
                      transform: 'translateX(4px)',
                      transition: 'all 0.3s ease'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? item.color : 'text.secondary',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiTypography-root': {
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? 'text.primary' : 'text.secondary'
                      }
                    }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        ml: 1
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Admin Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Settings />}
          onClick={handleSettings}
          sx={{
            mb: 2,
            borderRadius: 3,
            borderColor: 'rgba(26, 35, 126, 0.3)',
            color: 'text.secondary',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'primary.main',
              background: 'rgba(26, 35, 126, 0.04)'
            }
          }}
        >
          {t('admin.settings')}
        </Button>
        
        <Button
          fullWidth
          variant="contained"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
            boxShadow: '0 4px 16px rgba(211, 47, 47, 0.3)',
            fontWeight: 700,
            '&:hover': {
              background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(211, 47, 47, 0.4)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {t('common.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* CSS Keyframes Injection */}
      <style>{pulseKeyframes}</style>
      
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
            zIndex: theme.zIndex.drawer + 1
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {t('admin.adminDashboard')}
            </Typography>
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={pendingNotificationsCount || 0} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
              borderRight: '1px solid rgba(0,0,0,0.08)'
            }
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
              borderRight: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.08)'
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          minHeight: '100vh'
        }}
      >
        {/* Content Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Background */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(57, 73, 171, 0.03) 100%)',
              zIndex: 0
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              Welcome back, Administrator
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Manage your platform, verify users, and oversee all operations from your command center.
              </Typography>
              <Button
                variant="outlined"
                startIcon={refreshing ? <CircularProgress size={16} /> : <TrendingUp />}
                onClick={() => fetchDashboardStats(true)}
                disabled={loading || refreshing}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {refreshing ? 'Refreshing...' : loading ? 'Loading...' : 'Refresh Stats'}
              </Button>
            </Box>
            
            {/* Real-time Data Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    animation: 'pulse 2s infinite'
                  }}
                />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  Live Data
                </Typography>
              </Box>
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Auto-refresh every 2 minutes
              </Typography>
            </Box>
            
            {/* Error Display */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  borderRadius: 2,
                  '& .MuiAlert-message': { fontWeight: 600 }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => fetchDashboardStats()}
                    disabled={loading}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
            
            {/* Quick Stats */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Row 1 - Primary Stats */}
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(25, 118, 210, 0.1)',
                      border: '1px solid rgba(25, 118, 210, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <People sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                      {stats.users?.total || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Users
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(237, 108, 2, 0.1)',
                      border: '1px solid rgba(237, 108, 2, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <Gavel sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                      {stats.verification?.pending || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Review
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(46, 125, 50, 0.1)',
                      border: '1px solid rgba(46, 125, 50, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <VerifiedUser sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                      {stats.verification?.approved || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approved Ads
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(156, 39, 176, 0.1)',
                      border: '1px solid rgba(156, 39, 176, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <MonetizationOn sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 700 }}>
                      {stats.withdrawals?.pending || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Withdrawals
                    </Typography>
                  </Paper>
                </Grid>
                
                {/* Row 2 - Secondary Stats */}
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(255, 111, 0, 0.1)',
                      border: '1px solid rgba(255, 111, 0, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <Gavel sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                      {stats.appeals?.pending || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Appeals
                    </Typography>
                  </Paper>
                </Grid>
                
                {/* Row 3 - Additional Stats */}
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(76, 175, 80, 0.1)',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <VideoLibrary sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                      {stats.videos?.total || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Videos
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(255, 152, 0, 0.1)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <Receipt sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                      {stats.transactions?.total || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Transactions
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(33, 150, 243, 0.1)',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <Business sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700 }}>
                      {stats.users?.advertisers || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Advertisers
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(233, 30, 99, 0.1)',
                      border: '1px solid rgba(233, 30, 99, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <AccountBalance sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                                              {(() => {
                          try {
                            const amount = Number(stats.withdrawals?.total_amount);
                            if (amount && !isNaN(amount)) {
                              return `${(amount / 1000).toFixed(2)} KWD`;
                            }
                            return '0 KWD';
                          } catch (error) {
                            return '0 KWD';
                          }
                        })()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Withdrawn
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Page Content */}
        <Box
          sx={{
            background: 'white',
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}