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
  Grid,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountBalance,
  Person,
  Business,
  Payment,
  CheckCircle,
  Cancel,
  Visibility,
  FilterList,
  Search
} from '@mui/icons-material';
import api from '../api';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    user_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchWithdrawals();
  }, [filters]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await api.get(`/api/admin/withdrawals?${queryParams}`);
      
      if (res.data.success) {
        setWithdrawals(res.data.data.withdrawals);
        setStats(res.data.data.statistics);
        setPagination(res.data.data.pagination);
      } else {
        setError('Failed to fetch withdrawals');
      }
    } catch (error) {
      // Error handled in UI
      setError('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (withdrawal, type) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setAdminNotes('');
    setShowActionDialog(true);
  };

  const confirmAction = async () => {
    if (!adminNotes.trim()) {
      setError('Please provide admin notes');
      return;
    }

    try {
      setProcessingId(selectedWithdrawal.id);
      
      // Update withdrawal status
      await api.patch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        status: actionType === 'approve' ? 'completed' : 'rejected',
        admin_notes: adminNotes
      });

      // Refresh data
      await fetchWithdrawals();
      
      setShowActionDialog(false);
      setSelectedWithdrawal(null);
      setActionType('');
      setAdminNotes('');
      
      // Show success message
      setSuccessMessage(`Withdrawal ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error processing withdrawal
      setError('Failed to process withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (withdrawal) => {
    if (withdrawal.approved === true) return 'success';
    if (withdrawal.approved === false) return 'error';
    return 'warning'; // pending (null)
  };

  const getStatusIcon = (withdrawal) => {
    if (withdrawal.approved === true) return <CheckCircle />;
    if (withdrawal.approved === false) return <Cancel />;
    return <Payment />; // pending (null)
  };

  const getStatusLabel = (withdrawal) => {
    if (withdrawal.approved === true) return 'Completed';
    if (withdrawal.approved === false) return 'Rejected';
    return 'Pending';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'advertiser':
        return <Business />;
      case 'viewer':
        return <Person />;
      default:
        return <Person />;
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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewWithdrawal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowWithdrawalDetails(true);
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      w.user?.name?.toLowerCase().includes(searchLower) ||
      w.user?.phone?.includes(searchTerm) ||
      getStatusLabel(w).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2, m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Display success message if exists
  const successAlert = successMessage ? (
    <Alert severity="success" sx={{ borderRadius: 2, m: 2, mb: 2 }}>
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
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.03) 0%, rgba(156, 39, 176, 0.03) 100%)', 
          zIndex: 0 
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
            Withdrawal Management Dashboard
          </Typography>
          
          {/* Withdrawal Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800 }}>
                  {stats.total || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Withdrawals
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
                                          {(() => {
                          try {
                            const amount = Number(stats.total_amount);
                            if (amount && !isNaN(amount)) {
                              return `${amount.toFixed(3)} KWD`;
                            }
                            return '0 KWD';
                          } catch (error) {
                            // Handle formatting error silently
                            return '0 KWD';
                          }
                        })()}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Amount
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h3" color="warning.main" sx={{ fontWeight: 800 }}>
                  {stats.pending || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending
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
                  {stats.completed || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Completed
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Filters and Search */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search withdrawals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="User ID"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              label="User ID"
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={fetchWithdrawals}
                  sx={{ 
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                  }}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Withdrawals Table */}
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
            Withdrawal Requests ({filteredWithdrawals.length})
          </Typography>
        </Box>

        {filteredWithdrawals.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
              <Payment sx={{ fontSize: 40, color: 'success.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Withdrawal Requests Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters.' 
                : 'There are no withdrawal requests to display.'
              }
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Bank Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWithdrawals.map((w) => (
                  <TableRow 
                    key={w.id}
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
                            bgcolor: getRoleColor(w.user?.role) === 'primary' ? 'primary.main' : 'success.main'
                          }}
                        >
                          {getRoleIcon(w.user?.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {w.user?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {w.user?.phone || 'No Phone'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {(() => {
                          try {
                            const amount = Number(w.amount);
                            if (amount && !isNaN(amount)) {
                              return `${amount.toFixed(3)} KWD`;
                            }
                            return '0 KWD';
                          } catch (error) {
                            // Handle formatting error silently
                            return '0 KWD';
                          }
                        })()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {w.bank_details?.bank_name || 'Bank Name'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {w.bank_details?.account_number || 'Account Number'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(w)}
                        label={getStatusLabel(w)}
                        color={getStatusColor(w)}
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
                        {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {w.created_at ? new Date(w.created_at).toLocaleTimeString() : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewWithdrawal(w)}
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {w.approved === null && (
                          <>
                            <Tooltip title="Approve Withdrawal">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleAction(w, 'approve')}
                                disabled={processingId === w.id}
                                sx={{ 
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Withdrawal">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleAction(w, 'reject')}
                                disabled={processingId === w.id}
                                sx={{ 
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Pagination Info */}
      {pagination.total_pages > 1 && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Page {pagination.current_page} of {pagination.total_pages} • 
            Showing {pagination.total_withdrawals} of {pagination.total_records} withdrawals
          </Typography>
        </Paper>
      )}

      {/* Action Dialog */}
      <Dialog 
        open={showActionDialog} 
        onClose={() => setShowActionDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: actionType === 'approve' 
            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to <strong>{actionType}</strong> the withdrawal request for{' '}
            <strong>{selectedWithdrawal?.user?.name}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
                            Amount: <strong>{(() => {
                              try {
                                const amount = Number(selectedWithdrawal?.amount);
                                if (amount && !isNaN(amount)) {
                                  return `${amount.toFixed(3)} KWD`;
                                }
                                return '0 KWD';
                              } catch (error) {
                                // Handle formatting error silently
                                return '0 KWD';
                              }
                            })()}</strong>
          </Typography>
          <TextField
            margin="dense"
            label="Admin Notes *"
            fullWidth
            variant="outlined"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder={`Please provide a reason for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowActionDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmAction} 
            color={actionType === 'approve' ? 'success' : 'error'} 
            variant="contained"
            disabled={!adminNotes.trim() || processingId === selectedWithdrawal?.id}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {processingId === selectedWithdrawal?.id ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `${actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdrawal Details Dialog */}
      <Dialog 
        open={showWithdrawalDetails} 
        onClose={() => setShowWithdrawalDetails(false)} 
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
          Withdrawal Details
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedWithdrawal && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Withdrawal Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>ID:</strong> {selectedWithdrawal.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Amount:</strong> {(() => {
                      try {
                        const amount = Number(selectedWithdrawal.amount);
                        if (amount && !isNaN(amount)) {
                          return `${amount.toFixed(3)} KWD`;
                        }
                        return '0 KWD';
                      } catch (error) {
                        return '0 KWD';
                      }
                    })()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong> {selectedWithdrawal.status}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Request Date:</strong> {selectedWithdrawal.created_at ? new Date(selectedWithdrawal.created_at).toLocaleDateString() : 'Unknown'}
                  </Typography>
                  {selectedWithdrawal.admin_notes && (
                    <Typography variant="body2">
                      <strong>Admin Notes:</strong> {selectedWithdrawal.admin_notes}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  User Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(76, 175, 80, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(76, 175, 80, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedWithdrawal.user?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedWithdrawal.user?.email || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedWithdrawal.user?.phone || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowWithdrawalDetails(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}