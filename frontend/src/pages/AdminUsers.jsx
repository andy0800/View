import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  People,
  Person,
  Phone,
  Business,
  VerifiedUser,
  PendingActions,
  Block,
  Schedule,
  AdminPanelSettings,
  AccountCircle,
  Visibility,
  Edit,
  Delete,
  Refresh
} from '@mui/icons-material';
import api from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoad] = useState(true);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoad(true);
      setErr('');
      
      const res = await api.get('/api/admin/users');
      
      if (res.data.success) {
        // New API response format
        setUsers(res.data.data.users);
        setStats(res.data.data.statistics);
        setPagination(res.data.data.pagination);
      } else {
        // Legacy API response format
        setUsers(res.data);
        setStats({
          total: res.data.length,
          viewers: res.data.filter(u => u.role === 'viewer').length,
          advertisers: res.data.filter(u => u.role === 'advertiser').length,
          admins: res.data.filter(u => u.role === 'admin').length
        });
      }
    } catch (e) {
      setErr(e.response?.data?.message || t('errors.failedToLoadUsers'));
    } finally {
      setLoad(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings />;
      case 'advertiser':
        return <Business />;
      case 'viewer':
        return <Person />;
      default:
        return <AccountCircle />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'advertiser':
        return 'primary';
      case 'viewer':
        return 'success';
      default:
        return 'default';
    }
  };

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getKycStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <VerifiedUser />;
      case 'pending':
        return <PendingActions />;
      case 'rejected':
        return <Block />;
      default:
        return <Schedule />;
    }
  };

  // Handler functions for user actions
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || 'viewer',
      kyc_status: user.kyc_status || 'pending',
      company_name: user.company_name || ''
    });
    setShowEditUser(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    try {
      // Delete user via API
      await api.delete(`/api/admin/users/${selectedUser.id}`);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      
      // Show success message
      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErr('Failed to delete user');
    }
  };

  const handleSaveUser = async () => {
    // Validate required fields
    if (!editFormData.name || !editFormData.phone) {
      setErr('Name and phone are required fields');
      return;
    }

    try {
      // Update user via API
      await api.patch(`/api/admin/users/${selectedUser.id}`, editFormData);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...editFormData }
          : u
      ));
      
      setShowEditUser(false);
      setSelectedUser(null);
      setEditFormData({});
      
      // Show success message
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (err) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {err}
      </Alert>
    );
  }

  // Display success message if exists
  const successAlert = successMessage ? (
    <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
      {successMessage}
    </Alert>
  ) : null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Success Message */}
      {successAlert}
      
      {/* Header with stats */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Background */}
        <Box sx={{ 
          position: 'absolute', 
          top: -50, 
          right: -50, 
          width: 200, 
          height: 200, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(57, 73, 171, 0.03) 100%)', 
          zIndex: 0 
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              User Management
            </Typography>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={fetchUsers}
                disabled={loading}
                sx={{ 
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* User Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}>
                <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800 }}>
                  {stats.total || users.length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Users
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="h3" color="success.main" sx={{ fontWeight: 800 }}>
                  {stats.viewers || users.filter(u => u.role === 'viewer').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Viewers
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800 }}>
                  {stats.advertisers || users.filter(u => u.role === 'advertiser').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Advertisers
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(244, 67, 54, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(244, 67, 54, 0.2)'
              }}>
                <Typography variant="h3" color="error.main" sx={{ fontWeight: 800 }}>
                  {stats.admins || users.filter(u => u.role === 'admin').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Admins
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            All Users ({users.length})
          </Typography>
        </Box>

        {users.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'rgba(0,0,0,0.1)' }}>
              <People sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Users Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are currently no users in the system.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>KYC Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Joined</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(25, 118, 210, 0.02)',
                        transition: 'background-color 0.2s ease'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2, 
                            bgcolor: getRoleColor(user.role) === 'error' ? 'error.main' : 
                                    getRoleColor(user.role) === 'primary' ? 'primary.main' : 'success.main'
                          }}
                        >
                          {getRoleIcon(user.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {user.name || 'Unnamed User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {user.phone || 'No Phone'}
                        </Typography>
                        {user.email && (
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role || 'Unknown'}
                        color={getRoleColor(user.role)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getKycStatusIcon(user.kyc_status)}
                        label={user.kyc_status || 'Unknown'}
                        color={getKycStatusColor(user.kyc_status)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.created_at ? new Date(user.created_at).toLocaleTimeString() : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewUser(user)}
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => handleEditUser(user)}
                            sx={{ 
                              bgcolor: 'rgba(156, 39, 176, 0.1)',
                              '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.2)' }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user)}
                            sx={{ 
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Delete User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            This action cannot be undone. All user data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowDeleteConfirm(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteUser} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog 
        open={showUserDetails} 
        onClose={() => setShowUserDetails(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          User Details - {selectedUser?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Personal Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedUser.name || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> {selectedUser.phone || 'Not provided'}
                  </Typography>
                  {selectedUser.email && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {selectedUser.email}
                    </Typography>
                  )}
                  {selectedUser.civil_id && (
                    <Typography variant="body2">
                      <strong>Civil ID:</strong> {selectedUser.civil_id}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Account Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(76, 175, 80, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(76, 175, 80, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Role:</strong> {selectedUser.role || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong> {selectedUser.status || 'Active'}
                  </Typography>
                  {selectedUser.company_name && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Company:</strong> {selectedUser.company_name}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Created:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowUserDetails(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={showEditUser} 
        onClose={() => setShowEditUser(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Edit User - {selectedUser?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editFormData.phone || ''}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Role</InputLabel>
                <Select
                  value={editFormData.role || 'viewer'}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                  label="Role"
                >
                  <MenuItem value="viewer">Viewer</MenuItem>
                  <MenuItem value="advertiser">Advertiser</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>KYC Status</InputLabel>
                <Select
                  value={editFormData.kyc_status || 'pending'}
                  onChange={(e) => handleFormChange('kyc_status', e.target.value)}
                  label="KYC Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {editFormData.role === 'advertiser' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={editFormData.company_name || ''}
                  onChange={(e) => handleFormChange('company_name', e.target.value)}
                  variant="outlined"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowEditUser(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUser}
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}