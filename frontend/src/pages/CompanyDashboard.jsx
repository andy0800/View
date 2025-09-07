import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Business,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  MonetizationOn,
  People,
  VideoLibrary,
  Receipt,
  Schedule,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';
import api from '../api';

export default function CompanyDashboard() {
  const [companyData, setCompanyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch company-related data from various endpoints
      const [companyEarningsRes, transactionsRes, withdrawalsRes, videosRes, usersRes] = await Promise.all([
        api.get('/api/admin/company/earnings'),
        api.get('/api/admin/transactions?limit=10'),
        api.get('/api/admin/withdrawals?limit=10'),
        api.get('/api/admin/videos'),
        api.get('/api/admin/users')
      ]);

      // Extract and process data
      const companyEarnings = companyEarningsRes.data.success ? companyEarningsRes.data.data.company_earnings : {};
      const transactions = transactionsRes.data.success ? transactionsRes.data.data.transactions : [];
      const withdrawals = withdrawalsRes.data.success ? withdrawalsRes.data.data.withdrawals : [];
      const videos = videosRes.data.success ? videosRes.data.data.ads : [];
      const users = usersRes.data.success ? usersRes.data.data.users : [];

      // Use company wallet data for accurate financial information
      // Backend already provides KWD values, no need for conversion
      const totalCompanyFees = companyEarnings.total_company_fees || 0;
      const totalViewerRewards = companyEarnings.total_viewer_rewards || 0;
      const totalAdSpending = companyEarnings.total_ad_spending || 0;
      const companyBalance = companyEarnings.current_balance || 0;
      const totalVideoViews = companyEarnings.total_video_views || 0;

      // Debug logging to verify currency values
      console.log('🔍 Company Dashboard - Currency Values Received:');
      console.log('   Company Fees:', totalCompanyFees, 'KWD');
      console.log('   Viewer Rewards:', totalViewerRewards, 'KWD');
      console.log('   Company Balance:', companyBalance, 'KWD');
      console.log('   Total Video Views:', totalVideoViews);

      // Calculate additional metrics from transaction data
      // Withdrawals are already in KWD, transactions are now in KWD
      const totalPaidOut = withdrawals
        .filter(w => w.approved === true) // Withdrawals use 'approved' field
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      const pendingWithdrawals = withdrawals
        .filter(w => w.approved === null) // Pending withdrawals have null approved status
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      const activeAds = videos.filter(v => v.verification_status === 'approved' && v.status === 'active');

      // Filter for company fee transactions in recent transactions
      // Use amount_kwd since backend now provides KWD values
      const companyFeeTransactions = transactions.filter(tx => tx.type === 'company_fee' && tx.status === 'completed');

      setCompanyData({
        // Company earnings from video views (50% of each view)
        totalCompanyFees,
        totalViewerRewards,
        totalAdSpending,
        companyBalance,
        totalVideoViews,
        
        // Withdrawal data
        totalPaidOut,
        pendingWithdrawals,
        
        // Platform statistics
        activeAds: activeAds.length,
        totalUsers: users.length,
        totalAdvertisers: users.filter(u => u.role === 'advertiser').length,
        totalViewers: users.filter(u => u.role === 'viewer').length,
        
        // Recent activity
        recentTransactions: transactions.slice(0, 5),
        recentWithdrawals: withdrawals.slice(0, 5),
        recentCompanyFees: companyFeeTransactions.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to load company data');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    try {
      const numAmount = Number(amount);
      if (isNaN(numAmount)) {
        return '0.000 KWD';
      }
      return `${numAmount.toFixed(3)} KWD`;
    } catch (error) {
      console.warn('Error formatting currency:', amount, error);
      return '0.000 KWD';
    }
  };

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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
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
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(76, 175, 80, 0.03) 100%)', 
          zIndex: 0 
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
            {t('admin.companyFinancialDashboard')}
          </Typography>
          
          {/* Key Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                  {formatCurrency(companyData.totalCompanyFees)}
                </Typography>
                                 <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                   {t('admin.companyFees')}
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
                <TrendingDown sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 800 }}>
                  {formatCurrency(companyData.totalViewerRewards)}
                </Typography>
                                 <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                   {t('admin.viewerRewards')}
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
                <MonetizationOn sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800 }}>
                  {formatCurrency(companyData.pendingWithdrawals)}
                </Typography>
                                 <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                   {t('admin.pendingWithdrawals')}
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
                <AccountBalance sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 800 }}>
                  {formatCurrency(companyData.companyBalance)}
                </Typography>
                                 <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                   {t('admin.companyBalance')}
                 </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Platform Statistics */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4
        }}
      >
                 <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
           {t('admin.platformStatistics')}
         </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                  {companyData.totalUsers || 0}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.totalUsers')}
                 </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Business sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 800 }}>
                  {companyData.totalAdvertisers || 0}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.advertisers')}
                 </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <VideoLibrary sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                  {companyData.activeAds || 0}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.activeAds')}
                 </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 800 }}>
                  {companyData.totalVideoViews || 0}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.totalVideoViews')}
                 </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Company Fee Transactions */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4
            }}
          >
                         <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
               {t('admin.recentCompanyFees')}
             </Typography>
            
            {companyData.recentCompanyFees?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyData.recentCompanyFees.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                            +{formatCurrency(tx.amount_kwd || tx.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.status || 'Completed'}
                            color={getStatusColor(tx.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <MonetizationOn sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.noCompanyFees')}
                 </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4
            }}
          >
                         <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
               {t('admin.recentTransactions')}
             </Typography>
            
            {companyData.recentTransactions?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyData.recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Chip
                            label={tx.type?.replace('_', ' ') || 'Unknown'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(tx.amount_kwd || tx.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.status || 'Unknown'}
                            color={getStatusColor(tx.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Receipt sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.noRecentTransactions')}
                 </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Withdrawals */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 4
            }}
          >
                         <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
               {t('admin.recentWithdrawals')}
             </Typography>
            
            {companyData.recentWithdrawals?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyData.recentWithdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(w.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={w.status || 'Unknown'}
                            color={getStatusColor(w.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Unknown'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <AccountBalance sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                                 <Typography variant="body2" color="text.secondary">
                   {t('admin.noRecentWithdrawals')}
                 </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Financial Summary */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        }}
      >
                 <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
           {t('admin.financialSummary')}
         </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
                             <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, mb: 1 }}>
                 {t('admin.companyFeeEarnings')}
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 {t('admin.fiftyPercentOfVideoViews')}
               </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 800, mt: 2 }}>
                {formatCurrency(companyData.totalCompanyFees)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
                             <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, mb: 1 }}>
                 {t('admin.viewerRewardsPaid')}
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 {t('admin.fiftyPercentOfVideoViews')}
               </Typography>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 800, mt: 2 }}>
                {formatCurrency(companyData.totalViewerRewards)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
                             <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, mb: 1 }}>
                 {t('admin.currentBalance')}
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 {t('admin.companyWalletBalance')}
               </Typography>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 800, mt: 2 }}>
                {formatCurrency(companyData.companyBalance)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
