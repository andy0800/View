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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AccountBalance,
  Person,
  Business,
  Receipt,
  TrendingUp,
  TrendingDown,
  Visibility,
  FilterList,
  Search
} from '@mui/icons-material';
import api from '../api';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    user_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await api.get(`/api/admin/transactions?${queryParams}`);
      
      if (res.data.success) {
        setTransactions(res.data.data.transactions);
        setStats(res.data.data.statistics);
        setPagination(res.data.data.pagination);
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (error) {
      // Error handled in UI
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit_purchase':
        return <TrendingUp />;
      case 'view_earned':
        return <TrendingDown />;
      case 'withdrawal':
        return <AccountBalance />;
      default:
        return <Receipt />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit_purchase':
        return 'success';
      case 'view_earned':
        return 'info';
      case 'withdrawal':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
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

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      tx.user?.name?.toLowerCase().includes(searchLower) ||
      tx.user?.phone?.includes(searchTerm) ||
      tx.type?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower)
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
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(33, 150, 243, 0.03) 100%)', 
          zIndex: 0 
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
            Transaction Management Dashboard
          </Typography>
          
          {/* Transaction Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }}>
                <Typography variant="h3" color="info.main" sx={{ fontWeight: 800 }}>
                  {stats.total || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Transactions
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
                              return `${(amount / 1000000).toFixed(3)} KWD`;
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
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800 }}>
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search transactions..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="credit_purchase">Credit Purchase</MenuItem>
                <MenuItem value="view_earned">View Earned</MenuItem>
                <MenuItem value="withdrawal">Withdrawal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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
                <MenuItem value="failed">Failed</MenuItem>
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
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={fetchTransactions}
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

      {/* Transactions Table */}
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
            Transactions ({filteredTransactions.length})
          </Typography>
        </Box>

        {filteredTransactions.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
              <Receipt sx={{ fontSize: 40, color: 'success.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Transactions Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters.' 
                : 'There are no transactions to display.'
              }
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Transaction</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow 
                    key={tx.id}
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
                            bgcolor: getTransactionColor(tx.type) === 'success' ? 'success.main' : 'info.main'
                          }}
                        >
                          {getTransactionIcon(tx.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {tx.transaction_category?.replace('_', ' ') || 'Transaction'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {tx.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 2, 
                            bgcolor: getRoleColor(tx.user?.role) === 'primary' ? 'primary.main' : 'success.main'
                          }}
                        >
                          {getRoleIcon(tx.user?.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {tx.user?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tx.user?.phone || 'No Phone'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTransactionIcon(tx.type)}
                        label={tx.type?.replace('_', ' ') || 'Unknown'}
                        color={getTransactionColor(tx.type)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {(() => {
                          try {
                            const amount = Number(tx.amount);
                            if (amount && !isNaN(amount)) {
                              return `${(amount / 1000000).toFixed(3)} KWD`;
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
                      <Chip
                        label={tx.type || 'Unknown'}
                        color={getTransactionColor(tx.type)}
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
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewTransaction(tx)}
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
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
            Showing {pagination.total_transactions} of {pagination.total_records} transactions
          </Typography>
        </Paper>
      )}

      {/* Transaction Details Dialog */}
      <Dialog 
        open={showTransactionDetails} 
        onClose={() => setShowTransactionDetails(false)} 
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
          Transaction Details
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedTransaction && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Transaction Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>ID:</strong> {selectedTransaction.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Amount:</strong> {(() => {
                      try {
                        const amount = Number(selectedTransaction.amount);
                        if (amount && !isNaN(amount)) {
                          return `${(amount / 1000).toFixed(3)} KWD`;
                        }
                        return '0 KWD';
                      } catch (error) {
                        return '0 KWD';
                      }
                    })()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {selectedTransaction.type}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong> {selectedTransaction.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleDateString() : 'Unknown'}
                  </Typography>
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
                    <strong>Name:</strong> {selectedTransaction.user?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedTransaction.user?.email || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Role:</strong> {selectedTransaction.user?.role || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowTransactionDetails(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}