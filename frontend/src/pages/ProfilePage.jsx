// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Avatar, 
  Chip, 
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Container,
  Paper
} from '@mui/material';
import { 
  Person, 
  Phone, 
  Email, 
  CalendarToday, 
  AccountBalance,
  TrendingUp,
  Visibility,
  AttachMoney,
  CheckCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { motion } from 'framer-motion';
import { fadeIn, motionTokens } from '../theme/motion';


import api from '../api';
import { formatKWD, filsToKwd } from '../utils/currencyUtils';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();


  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching profile and stats...');
      
      const [profileRes, statsRes] = await Promise.all([
        api.get('/api/viewer/profile'),
        api.get('/api/viewer/stats')
      ]);
      
      console.log('✅ Profile data:', profileRes.data);
      console.log('✅ Stats data:', statsRes.data);
      console.log('📊 Stats breakdown:', statsRes.data.stats);
      
      setProfile(profileRes.data);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error('❌ Failed to load profile or stats:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(t('errors.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="60vh"
        >
          <CircularProgress size={60} />
        </Box>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Container>
      </ResponsiveLayout>
    );
  }

  if (!profile) {
    return (
      <ResponsiveLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="info">
            {t('profile.noProfileDataAvailable')}
          </Alert>
        </Container>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <Box
        component={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: motionTokens.normal, ease: motionTokens.ease }}
        sx={{ minHeight: '100%', backgroundColor: 'background.default' }}
      >
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
        

        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                      {t('profile.viewerProfile')}
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar 
                  sx={{ 
                    width: isMobile ? 80 : 120, 
                    height: isMobile ? 80 : 120, 
                    mx: 'auto', 
                    mb: 3,
                    fontSize: isMobile ? '2rem' : '3rem',
                    bgcolor: 'primary.main'
                  }}
                >
                  {profile.name?.charAt(0)?.toUpperCase() || 'V'}
                </Avatar>
                
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                  {profile.name || t('profile.anonymousViewer')}
                </Typography>
                
                <Chip 
                  label={t('profile.viewerAccount')}
                  color="primary"
                  variant="outlined"
                  size="large"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body1" color="textSecondary" paragraph>
                  {t('profile.memberSince')} {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : t('profile.notProvided')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Person sx={{ mr: 1 }} />
                  {t('profile.personalInformation')}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('profile.phoneNumber')}
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1, fontSize: 'small' }} />
                    {profile.phone || t('profile.notProvided')}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('profile.civilId')}
                  </Typography>
                  <Typography variant="body1">
                    {profile.civil_id || t('profile.notProvided')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('profile.registrationDate')}
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 'small' }} />
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : t('profile.notProvided')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  {t('profile.accountStatistics')}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <AccountBalance color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {typeof stats?.currentBalance === 'number' ? formatKWD(stats.currentBalance) : (profile?.wallet?.balance ? formatKWD(profile.wallet.balance) : '0.000')} {t('currency.kwd')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {t('profile.balance')}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Visibility color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {stats?.totalViews || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {t('profile.totalViews')}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <AttachMoney color="warning" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="warning.main" fontWeight="bold">
                        {typeof stats?.totalRewards === 'number' ? formatKWD(stats.totalRewards) : '0.000'} {t('currency.kwd')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                                                 {t('profile.totalEarned')}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingUp color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="warning.main" fontWeight="bold">
                        {stats?.totalViews || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                                                 {t('profile.videosWatched')}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                                     {t('profile.accountStatus')}
                </Typography>
                
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Chip 
                    label={profile.is_active ? t('profile.active') : t('profile.inactive')}
                    color={profile.is_active ? "success" : "error"}
                    variant="outlined"
                    icon={profile.is_active ? <CheckCircle /> : null}
                  />
                  
                  <Chip 
                    label={profile.kyc_status === 'verified' ? t('profile.verified') : t('profile.pending')}
                    color={profile.kyc_status === 'verified' ? "primary" : "warning"}
                    variant="outlined"
                  />
                  
                  <Chip 
                    label={profile.kyc_status === 'verified' ? t('profile.eligibleForRewards') : t('profile.verificationRequired')}
                    color={profile.kyc_status === 'verified' ? "warning" : "default"}
                    variant="outlined"
                  />
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="body2" color="textSecondary">
                  {profile.kyc_status === 'verified' 
                    ? t('profile.accountStatusDescription') 
                    : t('profile.verificationRequiredDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      </Box>
    </ResponsiveLayout>
  );
}