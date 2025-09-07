import React from 'react';
import { 
  IconButton, 
  Button, 
  Box, 
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Language } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ variant = 'icon' }) {
  const { currentLanguage, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLanguageToggle = () => {
    toggleLanguage();
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={handleLanguageToggle}
        startIcon={<Language />}
        sx={{
          borderColor: 'rgba(255,255,255,0.3)',
          color: 'white',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        {currentLanguage === 'en' ? 'العربية' : 'English'}
      </Button>
    );
  }

  return (
    <IconButton
      onClick={handleLanguageToggle}
      sx={{
        color: 'inherit',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,0.1)'
        }
      }}
      title={t('common.switchLanguage')}
    >
      <Language />
      {!isMobile && (
        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {currentLanguage === 'en' ? 'العربية' : 'English'}
          </Typography>
        </Box>
      )}
    </IconButton>
  );
}
