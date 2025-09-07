import React, { useEffect, useState } from 'react'
import {
  Box, Button, Card, CardContent, Grid, Typography,
  TextField, Alert, Chip, Avatar, Divider, Paper,
  List, ListItem, ListItemText, ListItemIcon, useTheme,
  useMediaQuery, IconButton, Tooltip, CircularProgress,
  LinearProgress, Fade
} from '@mui/material'
import { 
  Business, 
  Person, 
  Phone, 
  Description,
  Verified,
  Pending,
  Error,
  Edit,
  Save,
  Cancel,
  DocumentScanner,
  AccountCircle,
  Refresh,
  TrendingUp,
  Visibility,
  AttachMoney,
  Campaign,
  Timer
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import api from '../api'

export default function AdvertiserProfile() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const { t } = useTranslation()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [realTimeStats, setRealTimeStats] = useState({
    totalViews: 0,
    activeCampads: 0,
    totalSpent: 0,
    conversionRate: 0,
    averageROI: 0
  })

  // Editable fields
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    company_name: '',
    license_number: '',
    signatory_name: ''
  })

  // Auto-refresh interval (2 minutes - less aggressive)
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchProfile()
    }, 120000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial data fetch
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const [profileRes, statsRes] = await Promise.all([
        api.get('/api/advertiser/profile'),
        api.get('/api/advertiser/dashboard')
      ])
      
      setProfile(profileRes.data.user)
      setEditData({
        name: profileRes.data.user.name || '',
        phone: profileRes.data.user.phone || '',
        company_name: profileRes.data.user.company_name || '',
        license_number: profileRes.data.user.license_number || '',
        signatory_name: profileRes.data.user.signatory_name || ''
      })

      // Update real-time statistics
      if (statsRes.data) {
        const stats = statsRes.data.stats
        const totalViews = stats.total_views || 0
        const totalSpent = stats.total_spent || 0
        const activeAds = stats.active_ads || 0
        
        setRealTimeStats({
          totalViews,
          activeAds,
          totalSpent,
          conversionRate: totalViews > 0 ? ((activeAds / stats.total_ads) * 100).toFixed(2) : 0,
          averageROI: totalSpent > 0 ? (totalViews / totalSpent).toFixed(2) : 0
        })
      }
      
      setLastUpdated(new Date())
    } catch (apiError) {
      // Handle API errors gracefully
      if (apiError.response?.status === 404 || apiError.response?.status === 500) {
        setError('No profile data available yet. Please complete your profile setup.');
      } else {
        setError('Failed to load profile information. Please try again.');
      }
      
      // Set empty profile without dummy data
      setProfile(null);
      setRealTimeStats({
        totalViews: 0,
        activeAds: 0,
        totalSpent: 0,
        conversionRate: 0,
        averageROI: 0
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setEditing(false)
    setEditData({
      name: profile.name || '',
      phone: profile.phone || '',
      company_name: profile.company_name || '',
      license_number: profile.license_number || '',
      signatory_name: profile.signatory_name || ''
    })
    setError('')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')

      await api.put('/api/advertiser/profile', editData)
      
      setSuccess('Profile updated successfully!')
      setEditing(false)
      await fetchProfile() // Refresh profile data

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const getKycStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <Verified color="success" />
      case 'pending':
        return <Pending color="warning" />
      case 'rejected':
        return <Error color="error" />
      default:
        return <Pending color="warning" />
    }
  }

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      default: return 'warning'
    }
  }

  const getKycStatusText = (status) => {
    switch (status) {
      case 'verified': return 'Verified'
      case 'pending': return 'Pending Review'
      case 'rejected': return 'Rejected'
      default: return 'Pending Review'
    }
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(3) + ' KWD'
  }

  if (loading && !profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (!profile) {
    return (
      <Box p={2}>
        <Alert severity="error">
          {t('errors.failedToLoadProfile')}
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={isMobile ? 1 : 2}>
      {/* Header with Auto-refresh Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            🏢 {t('profile.businessProfile')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('profile.businessProfileDescription')}
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
            <IconButton onClick={fetchProfile} size="small">
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Real-time Performance Banner */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Visibility sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{realTimeStats.totalViews.toLocaleString()}</Typography>
                <Typography variant="caption">{t('dashboard.totalViews')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Campaign sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{realTimeStats.activeAds}</Typography>
                <Typography variant="caption">{t('dashboard.activeCampaigns')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <AttachMoney sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{formatCurrency(realTimeStats.totalSpent)}</Typography>
                <Typography variant="caption">{t('dashboard.totalSpent')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <TrendingUp sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{realTimeStats.averageROI}</Typography>
                <Typography variant="caption">{t('dashboard.avgRoi')}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={isMobile ? 1.5 : 2}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Fade in={true} timeout={500}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                    <Business sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="h5">{profile.company_name || 'Business Account'}</Typography>
                      <Chip
                        icon={getKycStatusIcon(profile.kyc_status)}
                        label={getKycStatusText(profile.kyc_status)}
                        color={getKycStatusColor(profile.kyc_status)}
                        size="small"
                      />
                    </Box>
                    <Typography color="textSecondary">
                      Account ID: {profile.id}
                    </Typography>
                    <Typography color="textSecondary">
                      Member since: {new Date(profile.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    {!editing ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          disabled={loading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Business Information */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={700}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('advertiser.businessInformation')}
                </Typography>

                {editing ? (
                  <Box>
                    <TextField
                      fullWidth
                      label={t('advertiser.companyName')}
                      value={editData.company_name}
                      onChange={(e) => setEditData(prev => ({ ...prev, company_name: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label={t('advertiser.licenseNumber')}
                      value={editData.license_number}
                      onChange={(e) => setEditData(prev => ({ ...prev, license_number: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label={t('advertiser.signatoryName')}
                      value={editData.signatory_name}
                      onChange={(e) => setEditData(prev => ({ ...prev, signatory_name: e.target.value }))}
                    />
                  </Box>
                ) : (
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Business />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('advertiser.companyName')}
                        secondary={profile.company_name || t('advertiser.notProvided')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('advertiser.licenseNumber')}
                        secondary={profile.license_number || t('advertiser.notProvided')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('advertiser.authorizedSignatory')}
                        secondary={profile.signatory_name || t('advertiser.notProvided')}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Fade in={true} timeout={900}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('advertiser.contactInformation')}
                </Typography>

                {editing ? (
                  <Box>
                    <TextField
                      fullWidth
                      label={t('advertiser.contactName')}
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label={t('advertiser.phoneNumber')}
                      value={editData.phone}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      helperText={t('advertiser.phoneFormat')}
                    />
                  </Box>
                ) : (
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('advertiser.contactName')}
                        secondary={profile.name || t('advertiser.notProvided')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('advertiser.phoneNumber')}
                        secondary={profile.phone || t('advertiser.notProvided')}
                      />
                    </ListItem>
                  </List>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* KYC Status */}
        <Grid item xs={12}>
          <Fade in={true} timeout={1100}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <Verified sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('advertiser.kycVerificationStatus')}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getKycStatusIcon(profile.kyc_status)}
                  <Box>
                    <Typography variant="h6">
                      {getKycStatusText(profile.kyc_status)}
                    </Typography>
                    <Typography color="textSecondary">
                      {profile.kyc_status === 'verified' 
                        ? t('advertiser.businessAccountVerified')
                        : profile.kyc_status === 'pending'
                        ? t('advertiser.verificationUnderReview')
                        : t('advertiser.verificationNotApproved')
                      }
                    </Typography>
                  </Box>
                </Box>

                {profile.kyc_status === 'verified' && (
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>{t('advertiser.verifiedOn')}:</strong> {profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : t('advertiser.recently')}
                    </Typography>
                  </Alert>
                )}

                {profile.kyc_status === 'pending' && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      {t('advertiser.verificationDocumentsReviewing')}
                    </Typography>
                  </Alert>
                )}

                {profile.kyc_status === 'rejected' && (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      {t('advertiser.verificationNotApprovedContact')}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Documents */}
        <Grid item xs={12}>
          <Fade in={true} timeout={1300}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <DocumentScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('advertiser.businessDocuments')}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <DocumentScanner color="primary" />
                        <Box>
                          <Typography variant="subtitle1">{t('advertiser.commercialLicense')}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {profile.license_doc_key ? t('advertiser.documentUploaded') : t('advertiser.noDocumentUploaded')}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {!profile.license_doc_key && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Please upload your commercial license document for KYC verification. 
                      Contact support if you need assistance with document upload.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Enhanced Account Statistics */}
        <Grid item xs={12}>
          <Fade in={true} timeout={1500}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  <AccountCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Real-time Account Statistics
                </Typography>

                <Grid container spacing={isMobile ? 1.5 : 2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Campaign sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" color="primary">
                        {profile.total_ads || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Ads Created
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Timer sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" color="success.main">
                        {profile.active_ads || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Active Campaigns
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <AttachMoney sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" color="warning.main">
                        {formatCurrency(profile.total_spent || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Spent
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Visibility sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" color="info.main">
                        {profile.total_views || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Views
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Performance Metrics */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" mb={2}>Performance Metrics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Conversion Rate</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {realTimeStats.conversionRate}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={parseFloat(realTimeStats.conversionRate)} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Average ROI</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {realTimeStats.averageROI}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(parseFloat(realTimeStats.averageROI) * 10, 100)} 
                          color="success"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  )
}