import React, { useContext, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
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
        // For advertisers, use advertiser credit endpoints
        creditRes = await api.get('/api/advertiser/credit');
        transactionsRes = await api.get('/api/advertiser/credit/transactions');
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
      <ResponsiveLayout transparent>
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
            sx={{ color: 'rgba(255,255,255,0.8)' }}
          />
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {t('common.loading')} {t('profile.wallet')}...
          </Typography>
        </Box>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout transparent>
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4, color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
          {t('navigation.credit')}
        </Typography>

        {user && user.role === 'advertiser' && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              bgcolor: 'rgba(59,130,246,0.15)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(59,130,246,0.3)'
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              📊 You are viewing your <strong>Advertiser Account</strong> credit balance and transaction history.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)'
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              bgcolor: 'rgba(34,197,94,0.15)',
              color: '#86efac',
              border: '1px solid rgba(34,197,94,0.3)'
            }}
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Credit Balance Card */}
          <Grid item xs={12} md={6}>
            <Card
              className="viewer-credit-card"
              sx={{
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalance sx={{ mr: 1, fontSize: 40, color: '#60a5fa' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {t('profile.balance')}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                      {formatKWD(credit)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('profile.walletBalanceDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Withdrawal Card */}
          <Grid item xs={12} md={6}>
            <Card
              className="viewer-credit-card"
              sx={{
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255,255,255,0.95)' }}>
                  {t('profile.withdraw')}
                </Typography>
                <Box
                  display="flex"
                  gap={2}
                  alignItems="flex-end"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  flexWrap="nowrap"
                >
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box
                      component="label"
                      htmlFor="withdraw-amount"
                      sx={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.6)'
                      }}
                    >
                      {t('profile.amount')} ({t('currency.kwd')})
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 1,
                        border: '1px solid rgba(255,255,255,0.15)',
                        bgcolor: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        minHeight: 48,
                        transition: 'border-color 0.2s',
                        '&:focus-within': {
                          borderColor: '#60a5fa',
                          borderWidth: 2,
                          outline: 'none'
                        }
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          px: 2,
                          fontSize: '1rem',
                          color: 'rgba(255,255,255,0.6)'
                        }}
                      >
                        {t('currency.kwd')}
                      </Typography>
                      <Box
                        component="input"
                        id="withdraw-amount"
                        type="number"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        disabled={loading}
                        min={0}
                        step={0.001}
                        placeholder="0.000"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          outline: 'none',
                          bgcolor: 'transparent',
                          color: 'rgba(255,255,255,0.95)',
                          fontSize: '1rem',
                          py: 1.5,
                          pr: 2,
                          height: '100%',
                          '&::placeholder': { color: 'rgba(255,255,255,0.4)' }
                        }}
                      />
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleWithdraw}
                    disabled={!withdrawalAmount || loading || parseFloat(withdrawalAmount) <= 0}
                    startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Payment />}
                    sx={{
                      bgcolor: '#3b82f6',
                      minHeight: 48,
                      flexShrink: 0,
                      minWidth: { xs: '100%', sm: 'auto' },
                      '&:hover': { bgcolor: '#2563eb' }
                    }}
                  >
                    {loading ? t('common.processing') : t('profile.withdraw')}
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                  {t('profile.minimumWithdrawal')}: {formatKWD(1.000)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Transaction History */}
          <Grid item xs={12}>
            <Card
              className="viewer-credit-card"
              sx={{
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <History sx={{ mr: 1, color: '#60a5fa' }} />
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                    {t('profile.transactions')}
                  </Typography>
                </Box>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </Box>
                ) : transactions.length > 0 ? (
                  <List sx={{ '& .MuiListItem-root': { borderColor: 'rgba(255,255,255,0.1)' } }}>
                    {transactions.map((transaction, index) => (
                      <React.Fragment key={transaction.id || index}>
                        <ListItem>
                          <ListItemIcon>
                            {transaction.type === 'credit' ? (
                              <TrendingUp sx={{ color: '#86efac' }} />
                            ) : (
                              <TrendingDown sx={{ color: '#fca5a5' }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {transaction.type === 'credit' ? t('profile.earned') : t('profile.spent')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                {transaction.description || t('profile.transaction')}
                              </Typography>
                            }
                          />
                          <Box display="flex" flexDirection="column" alignItems="flex-end">
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{ color: transaction.type === 'credit' ? '#86efac' : '#fca5a5' }}
                            >
                              {transaction.type === 'credit' ? '+' : '-'}{formatKWD(Math.abs((transaction.amount || 0) / 1000000))}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < transactions.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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