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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  VerifiedUser,
  Person,
  Business,
  CheckCircle,
  Cancel,
  PendingActions,
  Schedule,
  AccountCircle,
  Visibility,
  Phone,
  Email
} from '@mui/icons-material';
import api from '../api';

export default function AdminVerify() {
  const [reqs, setReqs] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchKycRequests();
  }, []);

  const fetchKycRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/kyc');
      
      if (res.data.success) {
        // New API response format
        setReqs(res.data.data.users);
      } else {
        // Legacy API response format
        setReqs(res.data);
      }
    } catch (error) {
      setErr(t('errors.failedToLoadKyc'));
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id, status, reason = '') => {
    try {
      setProcessingId(id);
      await api.patch(`/api/admin/kyc/${id}`, { status, reason });
      setReqs(r => r.filter(x => x.id !== id));
      
      if (status === 'verified') {
        // Show success message or notification
        setSuccessMessage('User verified successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (status === 'rejected') {
        // Show rejection message
        setSuccessMessage('User rejected successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setErr(t('errors.failedToUpdate'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleReject = (user) => {
    setSelectedUser(user);
    setShowRejectDialog(true);
  };

  const confirmRejection = () => {
    if (rejectionReason.trim()) {
      decide(selectedUser.id, 'rejected', rejectionReason.trim());
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedUser(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
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
      case 'advertiser':
        return 'primary';
      case 'viewer':
        return 'success';
      default:
        return 'default';
    }
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
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
            KYC Verification Dashboard
          </Typography>
          
          {/* KYC Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h3" color="warning.main" sx={{ fontWeight: 800 }}>
                  {reqs.length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending KYC
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
                  {reqs.filter(r => r.role === 'advertiser').length}
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
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="h3" color="success.main" sx={{ fontWeight: 800 }}>
                  {reqs.filter(r => r.role === 'viewer').length}
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
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }}>
                <Typography variant="h3" color="info.main" sx={{ fontWeight: 800 }}>
                  {reqs.filter(r => r.kyc_status === 'pending').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Awaiting Review
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* KYC Requests Table */}
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
            Pending KYC Requests ({reqs.length})
          </Typography>
        </Box>

        {reqs.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
              <VerifiedUser sx={{ fontSize: 40, color: 'success.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Pending KYC Requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All users have been verified or there are no pending requests.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Documents</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reqs.map((req) => (
                  <TableRow 
                    key={req.id}
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
                            bgcolor: getRoleColor(req.role) === 'primary' ? 'primary.main' : 'success.main'
                          }}
                        >
                          {getRoleIcon(req.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {req.name || 'Unnamed User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {req.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {req.phone || 'No Phone'}
                        </Typography>
                        {req.email && (
                          <Typography variant="caption" color="text.secondary">
                            {req.email}
                          </Typography>
                        )}
                        {req.civil_id && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Civil ID: {req.civil_id}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(req.role)}
                        label={req.role || 'Unknown'}
                        color={getRoleColor(req.role)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {req.company_name && (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {req.company_name}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {req.role === 'advertiser' ? 'Business Account' : 'Individual Account'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDetails(req)}
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve KYC">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => decide(req.id, 'verified')}
                            disabled={processingId === req.id}
                            sx={{ 
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                              '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                            }}
                          >
                            {processingId === req.id ? <CircularProgress size={16} /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject KYC">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleReject(req)}
                            disabled={processingId === req.id}
                            sx={{ 
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                            }}
                          >
                            {processingId === req.id ? <CircularProgress size={16} /> : <Cancel fontSize="small" />}
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

      {/* User Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)} 
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
                  {selectedUser.company_name && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Company:</strong> {selectedUser.company_name}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>KYC Status:</strong> 
                    <Chip 
                      label={selectedUser.kyc_status || 'Unknown'} 
                      color="warning" 
                      size="small" 
                      sx={{ ml: 1, borderRadius: 2 }}
                    />
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowDetailsDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={showRejectDialog} 
        onClose={() => setShowRejectDialog(false)} 
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
          Reject KYC Request
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reject the KYC request for <strong>{selectedUser?.name}</strong>?
          </Typography>
          <TextField
            margin="dense"
            label="Rejection Reason *"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowRejectDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRejection} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim()}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Reject KYC
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}