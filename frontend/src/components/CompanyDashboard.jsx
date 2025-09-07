// frontend/src/components/CompanyDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  MonetizationOn,
  VideoLibrary,
  People,
  Refresh,
  Visibility,
  AttachMoney,
  Business
} from '@mui/icons-material';
import api from '../api';

export default function CompanyDashboard() {
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [realTimeInterval, setRealTimeInterval] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchCompanyEarnings();
    
    // Set up real-time polling every 60 seconds for company earnings
    if (isRealTime) {
      const interval = setInterval(() => {
        console.log('🔄 Real-time company earnings refresh...');
        fetchCompanyEarnings(true);
        setLastUpdate(new Date());
      }, 60000); // 60 seconds
      
      setRealTimeInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [isRealTime]);

  const fetchCompanyEarnings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await api.get('/api/admin/company/earnings');
      
      if (response.data.success) {
        setEarnings(response.data.data.company_earnings);
      } else {
        setError('Failed to fetch company earnings');
      }
    } catch (error) {
      setError('Failed to fetch company earnings: ' + error.message);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount === 'number') {
      return `${amount.toFixed(2)} KWD`;
    }
    return '0.00 KWD';
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
        console.log('🔄 Real-time company earnings refresh started...');
        fetchCompanyEarnings(true);
        setLastUpdate(new Date());
      }, 60000);
      
      setRealTimeInterval(interval);
    }
  };

  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (percentage) => {
    if (percentage > 0) {
      return <TrendingUp sx={{ color: 'success.main' }} />;
    } else if (percentage < 0) {
      return <TrendingDown sx={{ color: 'error.main' }} />;
    }
    return null;
  };

  const getTrendColor = (percentage) => {
    if (percentage > 0) return 'success.main';
    if (percentage < 0) return 'error.main';
    return 'text.secondary';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ borderRadius: 2, m: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => fetchCompanyEarnings()}
            disabled={loading}
          >
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
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
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          color: 'white',
          borderRadius: 4
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Company Financial Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Real-time overview of company earnings, expenses, and financial performance
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => fetchCompanyEarnings(true)}
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
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Box>
      </Paper>

      {/* Real-time Status */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={isRealTime ? <TrendingUp /> : <TrendingDown />}
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
        <Button
          variant={isRealTime ? "contained" : "outlined"}
          startIcon={isRealTime ? <TrendingUp /> : <TrendingDown />}
          onClick={toggleRealTime}
          size="small"
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 600,
            ml: 'auto'
          }}
        >
          {isRealTime ? 'Real-time ON' : 'Real-time OFF'}
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Current Balance */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ fontSize: 32, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Current Balance
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                {formatCurrency(earnings.current_balance)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Available company funds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Earnings */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 32, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total Earnings
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                {formatCurrency(earnings.total_earnings)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Lifetime company revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Fees */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MonetizationOn sx={{ fontSize: 32, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Company Fees
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                {formatCurrency(earnings.total_company_fees)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                From ad view fees
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Views */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideoLibrary sx={{ fontSize: 32, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total Views
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                {earnings.total_video_views?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Video views processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue vs Expenses */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Financial Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(76, 175, 80, 0.1)', 
                  borderRadius: 3,
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, mb: 2 }}>
                    Revenue Streams
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Company Fees from Ads
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                      {formatCurrency(earnings.total_company_fees)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Earnings
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                      {formatCurrency(earnings.total_earnings)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(244, 67, 54, 0.1)', 
                  borderRadius: 3,
                  border: '1px solid rgba(244, 67, 54, 0.2)'
                }}>
                  <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, mb: 2 }}>
                    Expenses & Payouts
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Viewer Rewards Paid
                    </Typography>
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                      {formatCurrency(earnings.total_viewer_rewards)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Ad Spending Tracked
                    </Typography>
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                      {formatCurrency(earnings.total_ad_spending)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4,
              height: '100%'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Quick Stats
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Net Profit Margin
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                {earnings.total_earnings > 0 ? 
                  `${((earnings.total_earnings - earnings.total_viewer_rewards) / earnings.total_earnings * 100).toFixed(1)}%` : 
                  '0%'
                }
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Average Revenue per View
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                {earnings.total_video_views > 0 ? 
                  formatCurrency(earnings.total_company_fees / earnings.total_video_views) : 
                  '0.00 KWD'
                }
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current Balance Status
              </Typography>
              <Chip
                icon={<AccountBalance />}
                label={earnings.current_balance > 0 ? 'Healthy' : 'Low'}
                color={earnings.current_balance > 0 ? 'success' : 'warning'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Financial Table */}
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
            Financial Details
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Metric</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 2, color: 'success.main' }} />
                    Current Balance
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(earnings.current_balance)}
                  </Typography>
                </TableCell>
                <TableCell>Available company funds for operations</TableCell>
                <TableCell>
                  <Chip 
                    label={earnings.current_balance > 0 ? 'Available' : 'Low'} 
                    color={earnings.current_balance > 0 ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 2, color: 'primary.main' }} />
                    Total Earnings
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(earnings.total_earnings)}
                  </Typography>
                </TableCell>
                <TableCell>Lifetime company revenue from all sources</TableCell>
                <TableCell>
                  <Chip label="Growing" color="primary" size="small" />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MonetizationOn sx={{ mr: 2, color: 'secondary.main' }} />
                    Company Fees
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(earnings.total_company_fees)}
                  </Typography>
                </TableCell>
                <TableCell>Fees collected from advertiser ad views</TableCell>
                <TableCell>
                  <Chip label="Active" color="secondary" size="small" />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ mr: 2, color: 'info.main' }} />
                    Viewer Rewards
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="info.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(earnings.total_viewer_rewards)}
                  </Typography>
                </TableCell>
                <TableCell>Total rewards paid to viewers for watching ads</TableCell>
                <TableCell>
                  <Chip label="Paid" color="info" size="small" />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 2, color: 'warning.main' }} />
                    Ad Spending
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(earnings.total_ad_spending)}
                  </Typography>
                </TableCell>
                <TableCell>Total advertiser spending tracked</TableCell>
                <TableCell>
                  <Chip label="Tracked" color="warning" size="small" />
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VideoLibrary sx={{ mr: 2, color: 'success.main' }} />
                    Total Views
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                    {earnings.total_video_views?.toLocaleString() || '0'}
                  </Typography>
                </TableCell>
                <TableCell>Total video views that generated revenue</TableCell>
                <TableCell>
                  <Chip label="Processed" color="success" size="small" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
