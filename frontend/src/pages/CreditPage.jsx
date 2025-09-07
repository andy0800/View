import React, { useContext, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Divider,
  Chip,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Container,
  InputAdornment
} from '@mui/material';
import { 
  AttachMoney, 
  AccountBalance, 
  CreditCard, 
  Payment,
  TrendingUp,
  History,
  Warning,
  TrendingDown
} from '@mui/icons-material';
import { CreditContext } from "../contexts/CreditContext";
import { useAuth } from "../contexts/AuthContext";
import ResponsiveLayout from '../components/ResponsiveLayout';
import { useTranslation } from 'react-i18next';
import { formatKWD, filsToKwd } from '../utils/currencyUtils';

import api from '../api';

export default function CreditPage() {
  const { credit, setCreditDirect } = useContext(CreditContext);
  const { user } = useAuth();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Refresh data when credit context changes
  useEffect(() => {
    if (credit > 0) {
      fetchWalletData();
    }
  }, [credit]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      let creditRes, transactionsRes;
      
      // Use appropriate endpoints based on user role
      if (user && user.role === 'advertiser') {
        // For advertisers, reuse standard wallet endpoints (scoped by auth)
        creditRes = await api.get('/api/wallet');
        transactionsRes = await api.get('/api/wallet/transactions');
      } else {
        // For viewers, use viewer wallet endpoints
        creditRes = await api.get('/api/wallet');
        transactionsRes = await api.get('/api/wallet/transactions');
      }
      
      if (creditRes.data.success) {
        const { balance, balanceMicro } = creditRes.data;
        setCreditDirect(balance || 0, balanceMicro || 0);
        console.log('✅ Wallet balance loaded:', { balance, balanceMicro });
      } else {
        console.error('❌ Failed to load wallet balance:', creditRes.data);
        setError(t('errors.failedToLoadWallet'));
        return;
      }
      
      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.transactions || []);
        console.log('✅ Transactions loaded:', transactionsRes.data.transactions?.length || 0);
      } else {
        console.error('❌ Failed to load transactions:', transactionsRes.data);
        setTransactions([]);
      }
      
    } catch (err) {
      console.error('❌ Error fetching wallet data:', err);
      setError(t('errors.failedToLoadWallet'));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setError(t('errors.requiredField'));
      return;
    }

    if (parseFloat(withdrawalAmount) > credit) {
      setError(t('errors.insufficientBalance'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Use appropriate withdrawal endpoint based on user role
      let response;
      if (user && user.role === 'advertiser') {
        // Same withdraw endpoint; auth determines user
        response = await api.post('/api/wallet/withdraw', { 
          amount: parseFloat(withdrawalAmount) 
        });
      } else {
        response = await api.post('/api/wallet/withdraw', { 
          amount: parseFloat(withdrawalAmount) 
        });
      }
      
      setSuccess(t('success.withdrawalRequested', { amount: withdrawalAmount }));
      setWithdrawalAmount('');
      
      // Refresh wallet data
      await fetchWalletData();
      
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setError(err.response?.data?.message || t('errors.withdrawalFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return Math.abs(amount / 1000).toFixed(3);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'reward': return <AttachMoney color="success" />;
      case 'withdrawal': return <Payment color="warning" />;
      default: return <CreditCard color="primary" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'reward': return 'success.main';
      case 'withdrawal': return 'warning.main';
      default: return 'primary.main';
    }
  };

  if (loading && !credit) {
    return (
      <ResponsiveLayout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="60vh"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress 
            size={isMobile ? 40 : 60} 
            color="primary"
          />
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="textSecondary"
          >
            {t('common.loading')} {t('profile.wallet')}...
          </Typography>
        </Box>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
        
        
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          {t('navigation.credit')}
        </Typography>

        {user && user.role === 'advertiser' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              📊 You are viewing your <strong>Advertiser Account</strong> credit balance and transaction history.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Credit Balance Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalance color="primary" sx={{ mr: 1, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" color="textSecondary">
                      {t('profile.balance')}
                    </Typography>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {formatKWD(credit)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {t('profile.walletBalanceDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Withdrawal Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('profile.withdraw')}
                </Typography>
                <Box display="flex" gap={2} alignItems="flex-end">
                  <TextField
                    fullWidth
                    label={`${t('profile.amount')} (${t('currency.kwd')})`}
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{t('currency.kwd')}</InputAdornment>,
                    }}
                    disabled={loading}
                  />
                  <Button
                    variant="contained"
                    onClick={handleWithdraw}
                    disabled={!withdrawalAmount || loading || parseFloat(withdrawalAmount) <= 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
                  >
                    {loading ? t('common.processing') : t('profile.withdraw')}
                  </Button>
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {t('profile.minimumWithdrawal')}: {formatKWD(1.000)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Transaction History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <History color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {t('profile.transactions')}
                  </Typography>
                </Box>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : transactions.length > 0 ? (
                  <List>
                    {transactions.map((transaction, index) => (
                      <React.Fragment key={transaction.id || index}>
                        <ListItem>
                          <ListItemIcon>
                            {transaction.type === 'credit' ? (
                              <TrendingUp color="success" />
                            ) : (
                              <TrendingDown color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1">
                                {transaction.type === 'credit' ? t('profile.earned') : t('profile.spent')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="textSecondary">
                                {transaction.description || t('profile.transaction')}
                              </Typography>
                            }
                          />
                          <Box display="flex" flexDirection="column" alignItems="flex-end">
                            <Typography 
                              variant="h6" 
                              color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {transaction.type === 'credit' ? '+' : '-'}{formatKWD(Math.abs((transaction.amount || 0) / 1000000))}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < transactions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="textSecondary">
                      {t('profile.noTransactions')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ResponsiveLayout>
  );
}