import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import LanguageSwitcher from './LanguageSwitcher';

export default function TranslationDemo() {
  const { t } = useTranslation();
  const { currentLanguage, isRTL } = useLanguage();

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🌍 {t('common.dashboard')} - {t('common.profile')}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {t('dashboard.subtitle')}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('dashboard.totalViews')}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    1,234
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('dashboard.activeCampaigns')}
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    5
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body1">
              {t('common.currentLanguage')}: <strong>{currentLanguage.toUpperCase()}</strong>
            </Typography>
            <Typography variant="body1">
              {t('common.direction')}: <strong>{isRTL ? 'RTL' : 'LTR'}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LanguageSwitcher variant="button" />
            <Typography variant="body2" color="textSecondary">
              {t('common.clickToSwitch')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
