import React, { useEffect, useState } from 'react'
import {
  Box, Button, Card, CardContent, Grid, Typography,
  TextField, Alert, Chip, LinearProgress, useTheme,
  useMediaQuery, IconButton, Tooltip, CircularProgress,
  Fade, Divider, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material'
import { 
  AccountBalance, 
  Add, 
  Remove, 
  TrendingUp, 
  TrendingDown,
  Refresh,
  AttachMoney,
  Campaign,
  Visibility,
  Timer,
  Warning,
  CheckCircle,
  History,
  Speed
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { formatKWD, filsToKwd } from '../utils/currencyUtils';
import api from '../api'
import PaymentModal from '../components/PaymentModal'

export default function AdvertiserCredit() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const { t } = useTranslation()
  
  const [credit, setCredit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [transactions, setTransactions] = useState([])
  const [realTimeStats, setRealTimeStats] = useState({
    totalSpent: 0,
    activeCampaigns: 0,
    averageDailySpend: 0,
    projectedMonthlySpend: 0,
    creditUtilization: 0
  })
  const [creditAlerts, setCreditAlerts] = useState([])
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  // Auto-refresh interval (2 minutes - less aggressive)
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchCreditData()
    }, 120000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial data fetch
  useEffect(() => {
    fetchCreditData()
    
    // TEMPORARY: Check for pending package purchase - REVERSIBLE
    const pendingPurchase = localStorage.getItem('pendingPackagePurchase')
    if (pendingPurchase) {
      try {
        const purchaseData = JSON.parse(pendingPurchase)
        console.log('Package purchase data found:', purchaseData)
        
        // Clear the pending purchase data
        localStorage.removeItem('pendingPackagePurchase')
        
        // Redirect to payment gateway instead of wallet
        // For now, show an alert and redirect back to packages
        alert(`Package Purchase: ${purchaseData.packageName}\nBudget: ${purchaseData.budget} KWD\nEstimated Views: ${purchaseData.estimatedViews}\n\nRedirecting to payment gateway...`)
        
        // Redirect to packages page
        window.location.href = '/advertiser/packages'
      } catch (error) {
        console.error('Error parsing pending purchase data:', error)
      }
    }
  }, [])

  // Monitor credit alerts
  useEffect(() => {
    const alerts = []
    
    if (credit < 5) {
      alerts.push({
        type: 'critical',
        message: t('credit.criticalLowBalance'),
        icon: <Warning color="error" />
      })
    } else if (credit < 20) {
      alerts.push({
        type: 'warning',
        message: t('credit.lowBalanceWarning'),
        icon: <Warning color="warning" />
      })
    }

         if ((realTimeStats.creditUtilization || 0) > 80) {
       alerts.push({
         type: 'info',
         message: t('credit.highUtilizationWarning'),
         icon: <Speed color="info" />
       })
     }

    setCreditAlerts(alerts)
  }, [credit, realTimeStats.creditUtilization])

  // Ensure transactions is always an array
  useEffect(() => {
    if (!Array.isArray(transactions)) {
      console.warn('Transactions is not an array, resetting to empty array:', transactions)
      setTransactions([])
    }
  }, [transactions])

  // Debug logging for transactions state changes
  useEffect(() => {
    console.log('Transactions state changed:', transactions, 'Type:', typeof transactions, 'IsArray:', Array.isArray(transactions))
  }, [transactions])

  const fetchCreditData = async () => {
    try {
      setLoading(true)
      const [creditRes, transactionsRes, statsRes] = await Promise.all([
        api.get('/api/advertiser/credit'),
        api.get('/api/advertiser/credit/transactions'),
        api.get('/api/advertiser/dashboard')
      ])
      
      const currentCredit = parseFloat(creditRes.data.balance) || 0
      const currentTransactions = Array.isArray(transactionsRes.data?.transactions) 
        ? transactionsRes.data.transactions 
        : []
      
      setCredit(currentCredit)
      setTransactions(currentTransactions)
      
      // Update real-time statistics
      if (statsRes.data && statsRes.data.stats) {
        const stats = statsRes.data.stats
        const totalSpent = stats.totalUsed || 0  // Changed from total_spent to totalUsed based on backend
        const activeAds = stats.activeAds || 0   // Changed from active_ads to activeAds based on backend
        const totalAds = stats.totalAds || 0     // Changed from total_ads to totalAds based on backend
        
        // Calculate real metrics based on actual data
        // For now, use total spent as daily average (will be improved with time-based data)
        const averageDailySpend = totalSpent > 0 ? totalSpent : 0
        const projectedMonthlySpend = averageDailySpend * 30
        const creditUtilization = currentCredit > 0 ? ((totalSpent / (currentCredit + totalSpent)) * 100) : 0
        
        setRealTimeStats({
          totalSpent,
          activeCampaigns: activeAds,
          averageDailySpend: averageDailySpend,
          projectedMonthlySpend,
          creditUtilization: Math.min(creditUtilization, 100)
        })
      }
      
      setLastUpdated(new Date())
    } catch (apiError) {
      // Handle API errors gracefully
      if (apiError.response?.status === 404 || apiError.response?.status === 500) {
        setError('No credit data available yet. Please add funds to your account to see credit information.');
      } else {
        setError('Failed to load credit information. Please try again.');
      }
      
      setCredit(0);
      setTransactions([]);
      setRealTimeStats({
        totalSpent: 0,
        activeCampaigns: 0,
        averageDailySpend: 0,
        projectedMonthlySpend: 0,
        creditUtilization: 0
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false)
    }
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  const handleAddCredit = () => {
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = (paymentData) => {
    setPaymentModalOpen(false)
    setSuccess('Credit added successfully!')
    fetchCreditData() // Refresh credit data
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <Add color="success" />
      case 'withdrawal': return <Remove color="error" />
      case 'spent': return <Remove color="warning" />
      case 'refund': return <Add color="info" />
      default: return <AccountBalance />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit': return 'success'
      case 'withdrawal': return 'error'
      case 'spent': return 'warning'
      case 'refund': return 'info'
      default: return 'default'
    }
  }

  // Safe transactions getter - ensures we always return an array
  const getSafeTransactions = () => {
    return Array.isArray(transactions) ? transactions : []
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  // Additional safety check - ensure transactions is always an array
  if (!Array.isArray(transactions)) {
    console.warn('Transactions is not an array during render, resetting:', transactions)
    setTransactions([])
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  // Wrap the main render in a try-catch to prevent crashes
  try {
    // Safe transactions getter - ensures we always return an array
    const safeTransactions = getSafeTransactions()
    
    if (!Array.isArray(safeTransactions)) {
      console.error('getSafeTransactions returned non-array:', safeTransactions)
      setTransactions([])
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      )
    }



  // Fallback display if there's an error
  if (error) {
    return (
      <Box p={isMobile ? 1 : 2}>
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
          <Box sx={{ mt: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchCreditData}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Box>
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={isMobile ? 1 : 2}>
      {/* TEMPORARY: Package purchase notice - REVERSIBLE */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Temporary Notice:</strong> Package purchases are currently redirected to payment gateway. 
          Use the "Packages" menu to purchase packages.
        </Typography>
      </Alert>
      
      {/* Header with Auto-refresh Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            💰 {t('credit.creditManagement')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('credit.realTimeCreditAnalytics')}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            label={autoRefresh ? t('common.autoRefreshOn') : t('common.autoRefreshOff')} 
            color={autoRefresh ? 'success' : 'default'}
            size="small"
          />
          <Tooltip title={autoRefresh ? t('common.disableAutoRefresh') : t('common.enableAutoRefresh')}>
            <IconButton onClick={toggleAutoRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.refreshNow')}>
            <IconButton onClick={fetchCreditData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Last Updated */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Typography variant="caption" color="textSecondary">
          {t('common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
          <Box sx={{ mt: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchCreditData}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Box>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Credit Alerts */}
      {creditAlerts.length > 0 && (
        <Box mb={3}>
          {creditAlerts.map((alert, index) => (
            <Alert 
              key={index}
              severity={alert.type} 
              sx={{ mb: 1 }} 
              icon={alert.icon}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Main Credit Balance Card */}
      <Grid container spacing={isMobile ? 1.5 : 2} mb={3}>
        <Grid item xs={12} md={8}>
          <Fade in={true} timeout={500}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent sx={{ py: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <AccountBalance sx={{ fontSize: 50 }} />
            <Box>
                                         <Typography variant="h4" fontWeight="bold">
                       {t('credit.currentBalance')}
                     </Typography>
                     <Typography variant="body1" sx={{ opacity: 0.9 }}>
                       {t('credit.availableCreditForCampaigns')}
              </Typography>
            </Box>
          </Box>
                
                <Typography variant="h2" fontWeight="bold" mb={2}>
                  {formatKWD(credit)}
                </Typography>
                
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button 
                    variant="contained" 
                    color="inherit"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    startIcon={<Add />}
                    onClick={handleAddCredit}
                  >
                                         {t('credit.addCredit')}
                   </Button>
                   <Button 
                     variant="outlined" 
                     color="inherit"
                     sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
                     startIcon={<History />}
                   >
                     {t('credit.transactionHistory')}
                  </Button>
                </Box>
        </CardContent>
      </Card>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Fade in={true} timeout={700}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                                 <Typography variant="h6" mb={2}>{t('credit.quickActions')}</Typography>
                 <Box display="flex" flexDirection="column" gap={2}>
          <Button
            variant="contained"
                     fullWidth
                     startIcon={<Add />}
                     onClick={handleAddCredit}
                   >
                     {t('credit.addFunds')}
                   </Button>
                   <Button 
                     variant="outlined" 
            fullWidth
                     startIcon={<Remove />}
          >
                     {t('credit.withdraw')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
                     startIcon={<History />}
                   >
                     {t('credit.viewHistory')}
          </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Real-time Statistics Banner */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <AttachMoney sx={{ fontSize: 30, mb: 1 }} />
                                 <Typography variant="h6">{formatKWD(Number(realTimeStats.totalSpent) || 0)}</Typography>
                                 <Typography variant="caption">{t('credit.totalSpent')}</Typography>
               </Box>
             </Grid>
             <Grid item xs={6} sm={3}>
               <Box textAlign="center">
                 <Campaign sx={{ fontSize: 30, mb: 1 }} />
                                  <Typography variant="h6">{realTimeStats.activeCampaigns || 0}</Typography>
                 <Typography variant="caption">{t('credit.activeCampaigns')}</Typography>
               </Box>
             </Grid>
             <Grid item xs={6} sm={3}>
               <Box textAlign="center">
                 <Timer sx={{ fontSize: 30, mb: 1 }} />
                                  <Typography variant="h6">{formatKWD(Number(realTimeStats.averageDailySpend) || 0)}</Typography>
                 <Typography variant="caption">{t('credit.dailyAvgSpend')}</Typography>
               </Box>
             </Grid>
             <Grid item xs={6} sm={3}>
               <Box textAlign="center">
                 <TrendingUp sx={{ fontSize: 30, mb: 1 }} />
                                  <Typography variant="h6">{formatKWD(Number(realTimeStats.projectedMonthlySpend) || 0)}</Typography>
                 <Typography variant="caption">{t('credit.projectedMonthly')}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Credit Utilization and Spending Analysis */}
      <Grid container spacing={isMobile ? 1.5 : 2} mb={3}>
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={900}>
      <Card>
              <CardContent>
                                 <Typography variant="h6" mb={2}>{t('credit.creditUtilization')}</Typography>
                 <Box mb={2}>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                     <Typography variant="body2">{t('credit.currentUsage')}</Typography>
                                          <Typography variant="body2" fontWeight="bold">
                        {(realTimeStats.creditUtilization || 0).toFixed(1)}%
                      </Typography>
                   </Box>
                                      <LinearProgress 
                     variant="determinate" 
                     value={realTimeStats.creditUtilization || 0}
                     color={(realTimeStats.creditUtilization || 0) > 80 ? 'warning' : 'success'}
                     sx={{ height: 10, borderRadius: 5 }}
                   />
        </Box>

                 <Box display="flex" gap={2} flexWrap="wrap">
                   <Chip 
                     icon={<CheckCircle />} 
                     label={`${credit} ${t('currency.kwd')} ${t('credit.available')}`} 
                     color="success"
                     variant="outlined"
                   />
                   <Chip 
                     icon={<Warning />} 
                     label={`${realTimeStats.totalSpent} ${t('currency.kwd')} ${t('credit.spent')}`} 
                     color="warning"
                     variant="outlined"
                   />
                 </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={1100}>
            <Card>
              <CardContent>
                                 <Typography variant="h6" mb={2}>{t('credit.spendingTrends')}</Typography>
          <Box>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                     <Typography variant="body2">{t('credit.dailyAverage')}</Typography>
                                          <Typography variant="body2" fontWeight="bold">
                       {formatKWD(Number(realTimeStats.averageDailySpend) || 0)}
                     </Typography>
                   </Box>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                     <Typography variant="body2">{t('credit.monthlyProjection')}</Typography>
                                          <Typography variant="body2" fontWeight="bold">
                       {formatKWD(Number(realTimeStats.projectedMonthlySpend) || 0)}
                     </Typography>
                   </Box>
                   <Box display="flex" justifyContent="space-between" mb={1}>
                     <Typography variant="body2">{t('credit.activeCampaigns')}</Typography>
                                          <Typography variant="body2" fontWeight="bold">
                       {realTimeStats.activeCampaigns || 0}
                     </Typography>
                   </Box>
                 </Box>
                 
                 <Box sx={{ mt: 2 }}>
                                      <Typography variant="body2" color="textSecondary">
                     {t('credit.monthlyExpenditureProjection', { amount: formatKWD(Number(realTimeStats.projectedMonthlySpend) || 0) })}
                   </Typography>
                 </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Fade in={true} timeout={1300}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                             <Typography variant="h6">
                 <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                 {t('credit.recentTransactions')}
               </Typography>
               <Button variant="outlined" size="small">
                 {t('credit.viewAll')}
               </Button>
            </Box>
            
                         {getSafeTransactions().length === 0 ? (
              <Box textAlign="center" py={4}>
                 <AccountBalance sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                 <Typography variant="h6" color="textSecondary" mb={1}>
                   {t('credit.noTransactionsYet')}
                </Typography>
                <Typography color="textSecondary">
                   {t('credit.transactionHistoryWillAppear')}
                </Typography>
              </Box>
            ) : (
              <List>
                 {getSafeTransactions().slice(0, 5).map((transaction, index) => (
                   <React.Fragment key={transaction.id || index}>
                    <ListItem>
                      <ListItemIcon>
                        {getTransactionIcon(transaction.type)}
                      </ListItemIcon>
                      <ListItemText
                         primary={transaction.description || `${transaction.type || t('common.unknown')} ${t('credit.transaction')}`}
                         secondary={transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : t('common.unknownDate')}
                       />
                       <Box textAlign="right">
                         <Typography 
                           variant="h6" 
                           color={getTransactionColor(transaction.type)}
                           fontWeight="bold"
                         >
                           {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                           {formatKWD(Math.abs((Number(transaction.amount) || 0) / 1000000))}
                            </Typography>
                              <Chip 
                             label={transaction.type || t('common.unknown')} 
                                color={getTransactionColor(transaction.type)}
                                size="small"
                             variant="outlined"
                           />
                          </Box>
                    </ListItem>
                     {index < Math.min(getSafeTransactions().length, 5) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
                </CardContent>
              </Card>
      </Fade>

      {/* Credit Tips and Recommendations */}
      <Fade in={true} timeout={1500}>
        <Card sx={{ mt: 3 }}>
                <CardContent>
                         <Typography variant="h6" mb={2}>
               💡 {t('credit.creditManagementTips')}
             </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <CheckCircle color="success" />
                  <Box>
                                         <Typography variant="subtitle2" fontWeight="bold">
                       {t('credit.monitorDailySpending')}
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                       {t('credit.monitorDailySpendingDesc')}
                     </Typography>
                   </Box>
                  </Box>
               </Grid>
               <Grid item xs={12} sm={6}>
                 <Box display="flex" alignItems="flex-start" gap={2}>
                   <Speed color="info" />
                   <Box>
                     <Typography variant="subtitle2" fontWeight="bold">
                       {t('credit.setBudgetLimits')}
                  </Typography>
                     <Typography variant="body2" color="textSecondary">
                       {t('credit.setBudgetLimitsDesc')}
                    </Typography>
                   </Box>
                 </Box>
            </Grid>
               <Grid item xs={12} sm={6}>
                 <Box display="flex" alignItems="flex-start" gap={2}>
                   <TrendingUp color="primary" />
                   <Box>
                     <Typography variant="subtitle2" fontWeight="bold">
                       {t('credit.optimizeCampaigns')}
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                       {t('credit.optimizeCampaignsDesc')}
                     </Typography>
                   </Box>
                 </Box>
          </Grid>
               <Grid item xs={12} sm={6}>
                 <Box display="flex" alignItems="flex-start" gap={2}>
                   <Warning color="warning" />
          <Box>
                     <Typography variant="subtitle2" fontWeight="bold">
                       {t('credit.lowBalanceAlerts')}
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                       {t('credit.lowBalanceAlertsDesc')}
                </Typography>
          </Box>
          </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </Box>
  )
  } catch (error) {
    console.error('Error in AdvertiserCredit render:', error)
    // Fallback to safe display
    return (
      <Box p={isMobile ? 1 : 2}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('errors.componentError') || 'An error occurred while rendering the component'}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          {t('common.reload') || 'Reload Page'}
        </Button>
      </Box>
    )
  }
}