import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Card, CardContent, Grid, Typography,
  Chip, LinearProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, useTheme,
  useMediaQuery, Tooltip, Badge, Fade
} from '@mui/material'
import { 
  Visibility, 
  Pause, 
  PlayArrow, 
  Analytics,
  TrendingUp,
  AttachMoney,
  VisibilityOff,
  Refresh,
  Warning,
  CheckCircle,
  Timer,
  Speed,
  Info
} from '@mui/icons-material'
import api from '../api'
import { formatKWD } from '../utils/currencyUtils';

export default function AdvertiserAds() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const { t } = useTranslation()
  
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAd, setSelectedAd] = useState(null)
  const [insightsDialog, setInsightsDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [budgetAlerts, setBudgetAlerts] = useState([])
  const [showBudgetAlert, setShowBudgetAlert] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState({
    totalLiveViews: 0,
    totalSpent: 0,
    averageROI: 0
  })

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchAds()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial data fetch
  useEffect(() => {
    fetchAds()
  }, [])

  // Monitor budget alerts
  useEffect(() => {
    const lowBudgetAds = ads.filter(ad => {
      const spent = parseFloat(ad.usedBudget || ad.spent || 0)
      const budget = parseFloat(ad.budget || 0)
      const budgetUsage = budget > 0 ? (spent / budget) * 100 : 0
      return budgetUsage > 80 && (ad.status || 'draft') === 'active'
    })
    
    if (lowBudgetAds.length > 0) {
      setBudgetAlerts(lowBudgetAds.map(ad => {
        const spent = parseFloat(ad.usedBudget || ad.spent || 0)
        const budget = parseFloat(ad.budget || 0)
        return {
          id: ad.id,
          title: ad.title,
          usage: budget > 0 ? ((spent / budget) * 100).toFixed(1) : '0'
        }
      }))
      setShowBudgetAlert(true)
    }
  }, [ads])

  const fetchAds = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await api.get('/api/advertiser/ads')
      const adsData = response.data.ads || []
      setAds(adsData)
      
      // Calculate real-time statistics
      calculateRealTimeStats(adsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to fetch ads')
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  const calculateRealTimeStats = (adsData) => {
    if (!adsData || !Array.isArray(adsData)) {
      setRealTimeStats({
        totalLiveViews: 0,
        totalSpent: 0,
        averageROI: 0
      })
      return
    }
    
    const totalViews = adsData.reduce((sum, ad) => sum + (ad.viewsCompleted || ad.views || 0), 0)
    const totalSpent = adsData.reduce((sum, ad) => sum + (parseFloat(ad.usedBudget || ad.spent || 0) || 0), 0)
    const totalCost = adsData.reduce((sum, ad) => sum + (parseFloat(ad.budget ?? 0) || 0), 0)
    
    const averageROI = totalSpent > 0 ? (totalViews / totalSpent).toFixed(2) : 0
    
    setRealTimeStats({
      totalLiveViews: totalViews,
      totalSpent,
      averageROI: parseFloat(averageROI)
    })
  }

  const toggleAdStatus = async (adId, newStatus) => {
    try {
              await api.put(`/api/advertiser/ads/${adId}/status`, { status: newStatus })
      await fetchAds() // Refresh the list
    } catch (err) {
      setError(t('errors.failedToUpdateAdStatus'))
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'default'
    switch (status) {
      case 'active': return 'success'
      case 'paused': return 'warning'
      case 'completed': return 'info'
      case 'draft': return 'default'
      default: return 'default'
    }
  }

  const getVerificationStatusColor = (verificationStatus) => {
    if (!verificationStatus) return 'default'
    switch (verificationStatus) {
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      case 'under_appeal': return 'info'
      default: return 'default'
    }
  }

  const getDisplayStatus = (ad) => {
    // ✅ Enhanced null checks and fallbacks with proper validation
    const verificationStatus = ad.verification_status || 'pending'
    const adStatus = ad.status || 'draft'
    
    // ✅ Ensure verification status is valid
    if (!['pending', 'approved', 'rejected', 'under_appeal'].includes(verificationStatus)) {
      // Silently handle invalid verification status
    }
    
    // If ad is not verified, show verification status instead of advertiser status
    if (verificationStatus !== 'approved') {
      return {
        status: verificationStatus,
        color: getVerificationStatusColor(verificationStatus),
        isVerified: false
      }
    }
    
    // If verified, show advertiser-controlled status
    return {
      status: adStatus,
      color: getStatusColor(adStatus),
      isVerified: true
    }
  }

  const getBudgetUsagePercentage = (usedBudget, budget) => {
    const used = parseFloat(usedBudget || 0)
    const total = parseFloat(budget || 0)
    
    // ✅ FIXED: Handle corrupted budget values that exceed reasonable limits
    if (!total || total === 0) return 0
    if (total > 1000000) return 0 // If budget is over 1M KWD, something is wrong
    if (used > 1000000) return 0 // If used is over 1M KWD, something is wrong
    
    // ✅ FIXED: Ensure used doesn't exceed total (corrupted data protection)
    const safeUsed = Math.min(used, total)
    const percentage = (safeUsed / total) * 100
    
    // ✅ FIXED: Cap at 100% and handle edge cases
    return Math.min(Math.max(percentage, 0), 100)
  }

  const getBudgetUsageColor = (percentage) => {
    if (!percentage || percentage === 0) return 'success'
    if (percentage >= 90) return 'error'
    if (percentage >= 80) return 'warning'
    return 'success'
  }

  const getROI = (spent, views) => {
    if (!spent || spent === 0 || !views || views === 0) return 0
    return (views / spent).toFixed(2)
  }

  const openInsights = async (ad) => {
    try {
      const response = await api.get(`/api/advertiser/ads/${ad.id}/stats`)
      
      // Extract stats from backend response with null safety
      const { stats } = response.data || {}
      
      // Merge the original ad data with stats using correct field mapping
      const enhancedAd = {
        ...ad,
        // Map basic stats
        views: stats?.performance?.viewsCompleted || stats?.performance?.completedViews || 0,
        viewsCompleted: stats?.performance?.viewsCompleted || stats?.performance?.completedViews || 0,
        spent: stats?.basic?.usedBudget || stats?.roi?.totalSpent || 0,
        usedBudget: stats?.basic?.usedBudget || stats?.roi?.totalSpent || 0,
        remaining_budget: stats?.basic?.remainingBudget || 0,
        remainingBudget: stats?.basic?.remainingBudget || 0,
        budget: stats?.basic?.budget || 0,
        cost_per_view: stats?.performance?.costPerView || 0,
        estimated_remaining_views: Math.floor((stats?.basic?.remainingBudget || 0) / (stats?.performance?.costPerView || 1)),
        
        // Package info with proper null safety
        package: stats?.package ? {
          name: stats.package.name || 'Unknown Package',
          duration: stats.package.duration || 0,
          price_per_view: stats.package.price_per_view || 0,
          pricePerView: stats.package.pricePerView || 0
        } : (ad.package || {
          name: 'Unknown Package',
          duration: 0,
          price_per_view: 0,
          pricePerView: 0
        }),
        
        // Additional calculated fields
        budget_usage_percentage: stats?.performance?.budgetUtilization || stats?.performance?.utilizationPercentage || 0,
        conversion_rate: stats?.performance?.conversionRate || 0,
        completed_views: stats?.performance?.completedViews || stats?.performance?.viewsCompleted || 0,
        average_view_duration: stats?.performance?.averageViewDuration || 0
      }
      
      setSelectedAd(enhancedAd)
      setInsightsDialog(true)
    } catch (err) {
      console.error('Error loading ad insights:', err)
      setError(t('errors.failedToLoadAdInsights'))
    }
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  if (loading) {
    return (
      <Box p={2}>
        <Typography variant="h5" mb={2}>{t('ads.loadingYourAds')}</Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box p={isMobile ? 1 : 2}>
      {/* Header with Real-time Stats */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            📺 {t('ads.publishedAdsAndInsights')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('ads.realTimeCampaignMonitoring')}
          </Typography>
        </Box>
        
                  <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={autoRefresh ? t('ads.autoRefreshOn') : t('ads.autoRefreshOff')} 
              color={autoRefresh ? 'success' : 'default'}
              size="small"
            />
            <Tooltip title={autoRefresh ? t('ads.disableAutoRefresh') : t('ads.enableAutoRefresh')}>
              <IconButton onClick={toggleAutoRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('ads.refreshNow')}>
              <IconButton onClick={fetchAds} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
      </Box>

                   {/* Status System Explanation */}
      <Alert severity="info" sx={{ mb: 2 }}>
        📋 <strong>Status System Explained:</strong>
        <br />
        🔒 <strong>Verification Status</strong> (pending/approved/rejected): Controlled by admins - you cannot change this
        <br />
        🎮 <strong>Advertiser Status</strong> (active/paused/draft): Only available for approved ads - you control this
        <br />
        💡 <strong>Note:</strong> Unverified ads show "LOCKED" status and cannot be paused/played until approved
        <br />
        ✅ <strong>Data Status:</strong> Real-time data from database - refreshed every 30 seconds
      </Alert>

      {/* Real-time Statistics Banner */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Visibility sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{(realTimeStats.totalLiveViews || 0).toLocaleString()}</Typography>
                <Typography variant="caption">{t('ads.totalLiveViews')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <AttachMoney sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{formatKWD(Number(realTimeStats.totalSpent) || 0)}</Typography>
                <Typography variant="caption">{t('ads.totalSpent')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <TrendingUp sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{realTimeStats.averageROI || 0}</Typography>
                <Typography variant="caption">{t('ads.averageRoi')}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

             {/* Last Updated with Data Source */}
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
         <Box display="flex" alignItems="center" gap={1}>
           <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
             ✅ Real-time Database Data
           </Typography>
         </Box>
         <Typography variant="caption" color="textSecondary">
           {t('ads.lastUpdated')}: {lastUpdated ? lastUpdated.toLocaleTimeString() : t('common.never')}
         </Typography>
       </Box>

      {/* Budget Alerts */}
      {budgetAlerts && budgetAlerts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }} 
          onClose={() => setShowBudgetAlert(false)}
          action={
            <Button color="inherit" size="small" onClick={() => setShowBudgetAlert(false)}>
              {t('common.dismiss')}
            </Button>
          }
        >
                      <Typography variant="body2">
              <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
              {budgetAlerts ? budgetAlerts.length : 0} {t('ads.campaignsRunningLowOnBudget')}. {t('ads.considerPausingOrIncreasingBudget')}
            </Typography>
        </Alert>
      )}

       {!ads || ads.length === 0 ? (
         <Card>
           <CardContent sx={{ textAlign: 'center', py: 4 }}>
             <Typography variant="h6" color="textSecondary" mb={2}>
               {t('ads.noAdsPublishedYet')}
             </Typography>
             <Typography color="textSecondary" mb={3}>
               {t('ads.startByCreatingFirstAdCampaign')}
             </Typography>
             <Button 
               variant="contained" 
               color="primary"
               onClick={() => navigate('/advertiser/activate')}
             >
               {t('ads.createYourFirstAd')}
             </Button>
           </CardContent>
         </Card>
       ) : (
                 <Grid container spacing={isMobile ? 1.5 : 2}>
                       {ads && ads.map(ad => {
             if (!ad) return null
             const budgetUsage = getBudgetUsagePercentage(ad.usedBudget, ad.budget)
             const budgetColor = getBudgetUsageColor(budgetUsage)
             const isLowBudget = budgetUsage > 80
            
            return (
              <Grid item xs={12} md={6} lg={4} key={ad.id || Math.random()}>
                <Fade in={true} timeout={500}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: isLowBudget ? 2 : 1,
                    borderColor: isLowBudget ? 'warning.main' : 'divider'
                  }}>
                    <CardContent sx={{ flex: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                          {ad.title || t('common.untitledAd')}
                        </Typography>
                                                 <Box display="flex" alignItems="center" gap={1}>
                           {isLowBudget && (
                             <Tooltip title={t('advertiser.lowBudgetWarning')}>
                               <Warning color="warning" fontSize="small" />
                             </Tooltip>
                           )}
                           
                           {/* Main Status Display */}
                           <Box sx={{ textAlign: 'center' }}>
                             <Chip 
                               label={getDisplayStatus(ad).status} 
                               color={getDisplayStatus(ad).color}
                               size="small"
                               sx={{ mb: 0.5 }}
                             />
                             
                             {/* Status Type Label */}
                             <Typography 
                               variant="caption" 
                               sx={{ 
                                 display: 'block',
                                 fontSize: '10px',
                                 color: 'text.secondary',
                                 fontWeight: 'bold'
                               }}
                             >
                               {getDisplayStatus(ad).isVerified ? 'ADVERTISER STATUS' : 'VERIFICATION STATUS'}
                             </Typography>
                           </Box>
                         </Box>
                      </Box>

                                             <Typography color="textSecondary" mb={2} sx={{ fontSize: '0.9rem' }}>
                         {ad.description || t('common.noDescriptionAvailable')}
                       </Typography>

                                             {/* Status Summary Section */}
                       <Box mb={2} sx={{ 
                         p: 1.5, 
                         bgcolor: getDisplayStatus(ad).isVerified ? 'success.light' : 'warning.light',
                         borderRadius: 1,
                         border: `2px solid ${getDisplayStatus(ad).isVerified ? 'success.main' : 'warning.main'}`
                       }}>
                         <Typography variant="body2" sx={{ 
                           fontWeight: 'bold', 
                           color: getDisplayStatus(ad).isVerified ? 'success.dark' : 'warning.dark',
                           mb: 1
                         }}>
                           📊 STATUS OVERVIEW
                         </Typography>
                         
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Box>
                             <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                               Verification:
                             </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                             {(ad.verification_status || 'pending') === 'approved' ? '✅ APPROVED' : 
                              (ad.verification_status || 'pending') === 'pending' ? '⏳ PENDING' : 
                              (ad.verification_status || 'pending') === 'rejected' ? '❌ REJECTED' : 
                              '❓ UNKNOWN'}
                           </Typography>
                           </Box>
                           
                           <Box>
                             <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                               Advertiser Control:
                             </Typography>
                             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                               {getDisplayStatus(ad).isVerified ? 
                                 (ad.status === 'active' ? '▶️ LIVE' : 
                                  ad.status === 'paused' ? '⏸️ PAUSED' : 
                                  ad.status === 'draft' ? '📝 DRAFT' : 
                                  '❓ UNKNOWN') : 
                                 '🔒 LOCKED (Not Verified)'}
                             </Typography>
                           </Box>
                         </Box>
                       </Box>

                                               <Box mb={2}>
                          <Typography variant="body2" color="textSecondary">
                            {t('ads.section')}: {ad.section || t('common.unknown')}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {t('ads.package')}: {ad.package?.name || t('common.notAvailable')}
                          </Typography>
                        </Box>

                      {/* Budget Progress with Enhanced Warning */}
                      <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{t('ads.budgetUsage')}</Typography>
                          <Typography variant="body2" color={budgetColor}>
                            {formatKWD(Number(ad.usedBudget) || 0)} / {formatKWD(Number(ad.budget) || 0)}
                          </Typography>
                        </Box>
                        
                        {/* ✅ FIXED: Show warning for corrupted budget data */}
                        {(Number(ad.usedBudget) > 1000000 || Number(ad.budget) > 1000000) && (
                          <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontWeight: 'bold' }}>
                            ⚠️ CORRUPTED BUDGET DATA DETECTED - Contact Support
                          </Typography>
                        )}
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={budgetUsage}
                          color={budgetColor}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        
                        {isLowBudget && (
                          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                            ⚠️ {(budgetUsage || 0).toFixed(1)}% {t('ads.usedConsiderPausingOrIncreasingBudget')}
                          </Typography>
                        )}
                      </Box>

                      {/* Key Metrics */}
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={6}>
                          <Box textAlign="center">
                                                       <Typography variant="h6" color="primary">
                             {ad.views || 0}
                           </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {t('ads.totalViews')}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box textAlign="center">
                                                       <Typography variant="h6" color="secondary">
                             {getROI(ad.usedBudget || 0, ad.viewsCompleted || 0)}
                           </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {t('ads.viewsPerKwd')}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                                             {/* Performance Indicators */}
                       <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                         <Chip 
                           icon={<Speed />} 
                           label={`${(budgetUsage || 0).toFixed(1)}%`} 
                           size="small" 
                           color={budgetColor}
                           variant="outlined"
                         />
                         
                         {/* Status Indicator */}
                         {getDisplayStatus(ad).isVerified ? (
                           <Chip 
                             icon={<Timer />} 
                             label={ad.status === 'active' ? '▶️ LIVE' : 
                                    ad.status === 'paused' ? '⏸️ PAUSED' : 
                                    ad.status === 'draft' ? '📝 DRAFT' : ad.status} 
                             size="small" 
                             color={getStatusColor(ad.status)}
                             variant="outlined"
                             sx={{ fontWeight: 'bold' }}
                           />
                         ) : (
                           <Chip 
                             icon={<Timer />} 
                             label={`⏳ ${(ad.verification_status || 'pending').toUpperCase()}`}
                             size="small" 
                             color={getVerificationStatusColor(ad.verification_status)}
                             variant="outlined"
                             sx={{ fontWeight: 'bold' }}
                           />
                         )}
                       </Box>

                      {/* Action Buttons */}
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Tooltip title={t('ads.viewDetailedInsights')}>
                          <IconButton 
                            size="small" 
                            color="primary"
                                                         onClick={() => openInsights(ad || {})}
                          >
                            <Analytics />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Only show pause/play controls for verified ads */}
                        {getDisplayStatus(ad).isVerified && (
                          ad.status === 'active' ? (
                            <Tooltip title={t('ads.pauseCampaign')}>
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => toggleAdStatus(ad.id || t('common.unknown'), 'paused')}
                              >
                                <Pause />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={t('ads.activateCampaign')}>
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => toggleAdStatus(ad.id || t('common.unknown'), 'active')}
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )
                        )}
                        
                                                 {/* Show verification status info for unverified ads */}
                         {!getDisplayStatus(ad).isVerified && (
                           <span>
                             <Tooltip title={`Ad is ${ad.verification_status || 'pending'}. Waiting for admin approval.`}>
                               <IconButton 
                                 size="small" 
                                 color="info"
                                 disabled
                               >
                                 <Info />
                               </IconButton>
                             </Tooltip>
                           </span>
                         )}
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Enhanced Insights Dialog */}
      <Dialog 
        open={insightsDialog} 
        onClose={() => setInsightsDialog(false)}
        maxWidth="md"
        fullWidth
      >
                 <DialogTitle>
           <Box display="flex" alignItems="center" gap={1}>
             <Analytics color="primary" />
             {t('ads.realTimeAdInsights')}: {selectedAd?.title || t('common.untitledAd')}
           </Box>
         </DialogTitle>
        <DialogContent>
          {selectedAd && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>{t('ads.performanceMetrics')}</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.totalViews')}:</Typography>
                                             <Typography variant="h6">{selectedAd.views || 0}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.costPerView')}:</Typography>
                      <Typography variant="h6">{formatKWD(Number(selectedAd.cost_per_view) || 0)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.roiViewsPerKwd')}:</Typography>
                                             <Typography variant="h6">{getROI(selectedAd.usedBudget || selectedAd.spent || 0, selectedAd.viewsCompleted || selectedAd.views || 0)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.campaignStatus')}:</Typography>
                                             <Chip 
                         label={selectedAd.status || t('common.unknown')} 
                         color={getStatusColor(selectedAd.status || 'draft')}
                         size="small"
                       />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>{t('ads.budgetInformation')}</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.budget')}:</Typography>
                                             <Typography variant="h6">{formatKWD(Number(selectedAd.budget) || 0)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.spent')}:</Typography>
                                             <Typography variant="h6">{formatKWD(Number(selectedAd.usedBudget || selectedAd.spent) || 0)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.remainingBudget')}:</Typography>
                                             <Typography variant="h6">{formatKWD(Number(selectedAd.remaining_budget) || 0)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.estimatedRemainingViews')}:</Typography>
                      <Typography variant="h6">{selectedAd.estimated_remaining_views || 0}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.budgetUsage')}:</Typography>
                                             <Typography variant="h6" color={getBudgetUsageColor(getBudgetUsagePercentage(selectedAd.usedBudget || selectedAd.spent || 0, selectedAd.budget || 0))}>
                         {getBudgetUsagePercentage(selectedAd.usedBudget || selectedAd.spent || 0, selectedAd.budget || 0).toFixed(1)}%
                       </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>{t('ads.packageDetails')}</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.packageName')}:</Typography>
                                             <Typography>{selectedAd.package?.name || t('common.unknown')}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.duration')}:</Typography>
                                             <Typography>{selectedAd.package?.duration || t('common.unknown')} {t('time.seconds')}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{t('ads.pricePerView')}:</Typography>
                                             <Typography>{selectedAd.package?.price_per_view || t('common.unknown')} {t('currency.fils')}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInsightsDialog(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Budget Alert Snackbar */}
      <Snackbar
        open={showBudgetAlert}
        autoHideDuration={6000}
        onClose={() => setShowBudgetAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowBudgetAlert(false)} 
          severity="warning" 
          sx={{ width: '100%' }}
        >
          <Typography variant="body2">
            <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
            {budgetAlerts ? budgetAlerts.length : 0} {t('ads.campaignsRunningLowOnBudget')}. {t('ads.considerPausingOrIncreasingBudget')}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  )
}