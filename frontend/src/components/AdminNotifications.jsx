// frontend/src/components/AdminNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Pagination,
  Card,
  CardContent,
  Grid,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsNone,
  CheckCircle,
  Warning,
  Info,
  Error,
  MoreVert,
  MarkEmailRead,
  Archive,
  Delete,
  Refresh,
  FilterList,
  ClearAll
} from '@mui/icons-material';
import api from '../api';

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Notification Item component
function NotificationItem({ notification, onMarkAsRead, onArchive, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type, priority) => {
    const iconProps = { fontSize: 'large' };
    
    switch (type) {
      case 'verification':
        return <Warning {...iconProps} color="warning" />;
      case 'withdrawal':
        return <Info {...iconProps} color="info" />;
      case 'appeal':
        return <Error {...iconProps} color="error" />;
      case 'kyc':
        return <Info {...iconProps} color="primary" />;
      case 'system':
        return <Info {...iconProps} color="secondary" />;
      default:
        return <Notifications {...iconProps} color="action" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'verification':
        return 'Verification';
      case 'withdrawal':
        return 'Withdrawal';
      case 'appeal':
        return 'Appeal';
      case 'kyc':
        return 'KYC';
      case 'system':
        return 'System';
      default:
        return type;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    handleMenuClose();
  };

  const handleArchive = () => {
    onArchive(notification.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(notification.id);
    handleMenuClose();
  };

  const isExpired = notification.expires_at && new Date() > new Date(notification.expires_at);

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: notification.status === 'unread' ? '2px solid' : '1px solid',
        borderColor: notification.status === 'unread' ? 'primary.main' : 'divider',
        backgroundColor: notification.status === 'unread' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ mr: 2, mt: 0.5 }}>
            {getNotificationIcon(notification.type, notification.priority)}
          </Box>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
                {notification.title}
              </Typography>
              
              <Chip
                label={getTypeLabel(notification.type)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              
              <Chip
                label={notification.priority}
                size="small"
                color={getPriorityColor(notification.priority)}
                sx={{ mr: 1 }}
              />
              
              {isExpired && (
                <Chip
                  label="Expired"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {notification.message}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(notification.created_at)}
              </Typography>
              
              {notification.action_url && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(notification.action_url, '_blank')}
                  sx={{ textTransform: 'none' }}
                >
                  View Details
                </Button>
              )}
            </Box>
          </Box>
          
          <Box>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {notification.status === 'unread' && (
          <MenuItem onClick={handleMarkAsRead}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            Mark as Read
          </MenuItem>
        )}
        <MenuItem onClick={handleArchive}>
          <ListItemIcon>
            <Archive fontSize="small" />
          </ListItemIcon>
          Archive
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default function AdminNotifications() {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_notifications: 0
  });
  const [filter, setFilter] = useState('unread');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [realTimeInterval, setRealTimeInterval] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time polling every 30 seconds
    if (isRealTime) {
      const interval = setInterval(() => {
        console.log('🔄 Real-time notification refresh...');
        fetchNotifications(true);
        setLastUpdate(new Date());
      }, 30000); // 30 seconds
      
      setRealTimeInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [filter, pagination.current_page, isRealTime]);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await api.get('/api/admin/notifications', {
        params: {
          page: pagination.current_page,
          limit: 20,
          status: filter
        }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setPagination(response.data.data.pagination);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      setError('Failed to fetch notifications: ' + error.message);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await api.patch(`/api/admin/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read', read_at: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.patch('/api/admin/notifications/mark-all-read');
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
    
    if (realTimeInterval) {
      clearInterval(realTimeInterval);
      setRealTimeInterval(null);
    }
    
    if (!isRealTime) {
      // Start real-time mode
      const interval = setInterval(() => {
        console.log('🔄 Real-time notification refresh started...');
        fetchNotifications(true);
        setLastUpdate(new Date());
      }, 30000);
      
      setRealTimeInterval(interval);
    }
  };

  const handleArchive = async (notificationId) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'archived' }
            : notif
        )
      );
      
      // TODO: Implement archive API endpoint
      console.log('Archive notification:', notificationId);
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // TODO: Implement delete API endpoint
      console.log('Delete notification:', notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilter(['unread', 'read', 'archived'][newValue]);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => n.status === 'unread').length;
  };

  const getReadCount = () => {
    return notifications.filter(n => n.status === 'read').length;
  };

  const getArchivedCount = () => {
    return notifications.filter(n => n.status === 'archived').length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
          color: 'white',
          borderRadius: 4
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Admin Notifications
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Stay updated with system alerts, verification requests, and important updates
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              disabled={getUnreadCount() === 0}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Mark All Read
            </Button>
            
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Button
              variant={isRealTime ? "contained" : "outlined"}
              startIcon={isRealTime ? <NotificationsActive /> : <NotificationsNone />}
              onClick={toggleRealTime}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                color: isRealTime ? 'white' : 'white',
                backgroundColor: isRealTime ? 'success.main' : 'transparent',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: isRealTime ? 'success.dark' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {isRealTime ? 'Real-time ON' : 'Real-time OFF'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Real-time Status */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          icon={isRealTime ? <NotificationsActive /> : <NotificationsNone />}
          label={isRealTime ? 'Real-time Active' : 'Manual Mode'}
          color={isRealTime ? 'success' : 'default'}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        />
        {lastUpdate && (
          <Chip
            label={`Last Update: ${lastUpdate.toLocaleTimeString()}`}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2 }}
          />
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ borderRadius: 2, mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => fetchNotifications()}
              disabled={loading}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Notifications Tabs */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="notifications tabs"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
                px: 4
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }}
          >
            <Tab 
              icon={
                <Badge badgeContent={getUnreadCount()} color="error">
                  <NotificationsActive />
                </Badge>
              }
              label="Unread"
              iconPosition="start"
            />
            <Tab 
              icon={
                <Badge badgeContent={getReadCount()} color="primary">
                  <CheckCircle />
                </Badge>
              }
              label="Read"
              iconPosition="start"
            />
            <Tab 
              icon={<Archive />}
              label="Archived"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Unread Tab */}
        <TabPanel value={tabValue} index={0}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsNone sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No unread notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up! Check back later for new updates.
              </Typography>
            </Box>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
              
              {pagination.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.total_pages}
                    page={pagination.current_page}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>

        {/* Read Tab */}
        <TabPanel value={tabValue} index={1}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No read notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Notifications you've read will appear here.
              </Typography>
            </Box>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
              
              {pagination.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.total_pages}
                    page={pagination.current_page}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>

        {/* Archived Tab */}
        <TabPanel value={tabValue} index={2}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Archive sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No archived notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archived notifications will appear here.
              </Typography>
            </Box>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
              
              {pagination.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.total_pages}
                    page={pagination.current_page}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}
