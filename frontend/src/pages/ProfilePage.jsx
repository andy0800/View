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
      <ResponsiveLayout transparent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} sx={{ color: 'rgba(255,255,255,0.8)' }} />
        </Box>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout transparent>
        <Container maxWidth="md" sx={{ py: 4 }}>
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
        </Container>
      </ResponsiveLayout>
    );
  }

  if (!profile) {
    return (
      <ResponsiveLayout transparent>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert
            severity="info"
            sx={{
              bgcolor: 'rgba(59,130,246,0.15)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(59,130,246,0.3)'
            }}
          >
            {t('profile.noProfileDataAvailable')}
          </Alert>
        </Container>
      </ResponsiveLayout>
    );
  }

  const cardSx = {
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
  };

  return (
    <ResponsiveLayout transparent>
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4, color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
          {t('profile.viewerProfile')}
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Card className="viewer-profile-card" sx={cardSx}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: isMobile ? 80 : 120,
                    height: isMobile ? 80 : 120,
                    mx: 'auto',
                    mb: 3,
                    fontSize: isMobile ? '2rem' : '3rem',
                    bgcolor: '#3b82f6'
                  }}
                >
                  {profile.name?.charAt(0)?.toUpperCase() || 'V'}
                </Avatar>

                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                  {profile.name || t('profile.anonymousViewer')}
                </Typography>

                <Chip
                  label={t('profile.viewerAccount')}
                  variant="outlined"
                  size="large"
                  sx={{
                    mb: 2,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                    bgcolor: 'rgba(255,255,255,0.06)'
                  }}
                />

                <Typography variant="body1" paragraph sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('profile.memberSince')} {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : t('profile.notProvided')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card className="viewer-profile-card" sx={cardSx}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3, color: 'rgba(255,255,255,0.95)' }}>
                  <Person sx={{ mr: 1, color: '#60a5fa' }} />
                  {t('profile.personalInformation')}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {t('profile.phoneNumber')}
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                    <Phone sx={{ mr: 1, fontSize: 'small', color: 'rgba(255,255,255,0.7)' }} />
                    {profile.phone || t('profile.notProvided')}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {t('profile.civilId')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {profile.civil_id || t('profile.notProvided')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {t('profile.registrationDate')}
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.9)' }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 'small', color: 'rgba(255,255,255,0.7)' }} />
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : t('profile.notProvided')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Statistics */}
          <Grid item xs={12} md={6}>
            <Card className="viewer-profile-card" sx={cardSx}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3, color: 'rgba(255,255,255,0.95)' }}>
                  <TrendingUp sx={{ mr: 1, color: '#60a5fa' }} />
                  {t('profile.accountStatistics')}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <AccountBalance sx={{ fontSize: 40, mb: 1, color: '#60a5fa' }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                        {typeof stats?.currentBalance === 'number' ? formatKWD(stats.currentBalance) : (profile?.wallet?.balance ? formatKWD(profile.wallet.balance) : '0.000')} {t('currency.kwd')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {t('profile.balance')}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <Visibility sx={{ fontSize: 40, mb: 1, color: '#86efac' }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                        {stats?.totalViews || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {t('profile.totalViews')}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <AttachMoney sx={{ fontSize: 40, mb: 1, color: '#fbbf24' }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                        {typeof stats?.totalRewards === 'number' ? formatKWD(stats.totalRewards) : '0.000'} {t('currency.kwd')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {t('profile.totalEarned')}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <TrendingUp sx={{ fontSize: 40, mb: 1, color: '#93c5fd' }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                        {stats?.totalViews || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
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
            <Card className="viewer-profile-card" sx={cardSx}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'rgba(255,255,255,0.95)' }}>
                  {t('profile.accountStatus')}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Chip
                    label={profile.is_active ? t('profile.active') : t('profile.inactive')}
                    variant="outlined"
                    icon={profile.is_active ? <CheckCircle /> : null}
                    sx={{
                      borderColor: profile.is_active ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)',
                      color: profile.is_active ? '#86efac' : '#fca5a5',
                      '& .MuiChip-icon': { color: 'inherit' }
                    }}
                  />
                  <Chip
                    label={profile.kyc_status === 'verified' ? t('profile.verified') : t('profile.pending')}
                    variant="outlined"
                    sx={{
                      borderColor: profile.kyc_status === 'verified' ? 'rgba(59,130,246,0.5)' : 'rgba(251,191,36,0.5)',
                      color: profile.kyc_status === 'verified' ? '#93c5fd' : '#fbbf24'
                    }}
                  />
                  <Chip
                    label={profile.kyc_status === 'verified' ? t('profile.eligibleForRewards') : t('profile.verificationRequired')}
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'rgba(255,255,255,0.8)'
                    }}
                  />
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {profile.kyc_status === 'verified'
                    ? t('profile.accountStatusDescription')
                    : t('profile.verificationRequiredDescription')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ResponsiveLayout>
  );
}