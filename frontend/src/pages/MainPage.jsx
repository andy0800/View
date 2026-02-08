import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Tabs, 
  Tab,
  Chip,
  CircularProgress,
  Fade,
  Grow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { 
  PlayArrow, 
  Business, 
  AttachMoney, 
  TrendingUp,
  Restaurant,
  LocalHospital,
  School,
  Home,
  DirectionsCar,
  ShoppingCart,
  SportsEsports,
  Spa,
  Refresh
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AllAdsTab from '../components/AllAdsTab';
import CreditBar from '../components/CreditBar';
import api, { } from '../api';
import { getVideosBySection } from '../api/viewer';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const fontStack = '"Inter", "Poppins", "Cairo", "Noto Sans Arabic", "Roboto", "Helvetica", "Arial", sans-serif';

const ErrorState = ({ message, onRetry, isRTL }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" gutterBottom sx={{ fontFamily: fontStack, color: '#fca5a5' }}>
      {message}
    </Typography>
    <Button
      variant="outlined"
      startIcon={isRTL ? null : <Refresh />}
      endIcon={isRTL ? <Refresh /> : null}
      onClick={onRetry}
      sx={{ 
        mt: 2,
        borderRadius: 2,
        textTransform: 'none',
        borderColor: 'rgba(255,255,255,0.3)',
        color: 'rgba(255,255,255,0.9)',
        '&:hover': { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)' },
        '&:active': { transform: 'scale(0.98)' }
      }}
    >
      Try Again
    </Button>
  </Box>
);

const LoadingState = ({ label }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
    <CircularProgress size={38} sx={{ color: 'rgba(255,255,255,0.8)' }} />
    <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.7)', fontFamily: fontStack }}>
      {label}
    </Typography>
  </Box>
);

const SectionCard = ({ section, count, onClick, isRTL }) => (
  <Card
    className="viewer-section-card"
    onClick={onClick}
    role="button"
    aria-label={section.title}
    sx={{
      height: '100%',
      minHeight: 320,
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      borderRadius: 3,
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      transition: 'transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        backgroundColor: 'rgba(255,255,255,0.1) !important'
      },
      '&:active': { transform: 'translateY(-2px) scale(0.99)' }
    }}
  >
    <CardMedia
      component="div"
      sx={{
        height: 120,
        minHeight: 120,
        backgroundColor: section.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        flexShrink: 0
      }}
    >
      <Box sx={{ fontSize: 40 }}>
        {section.icon}
      </Box>
    </CardMedia>
    <CardContent
      sx={{
        textAlign: isRTL ? 'right' : 'left',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        py: 2,
        '&:last-child': { pb: 2 }
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: 'rgba(255,255,255,0.95)',
          fontFamily: fontStack,
          fontSize: '1.1rem',
          lineHeight: 1.3
        }}
      >
        {section.title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mb: 2,
          flex: 1,
          fontFamily: fontStack,
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {section.description}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
        <Chip
          label={`${count || 0} ${section.videosLabel}`}
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 600,
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'rgba(255,255,255,0.9)',
            backgroundColor: 'rgba(255,255,255,0.06)'
          }}
        />
        <Typography
          variant="caption"
          sx={{ fontFamily: fontStack, color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}
        >
          {count > 0 ? section.availableLabel : section.emptyLabel}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default function MainPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sections, setSections] = useState([]);
  const [sectionVideoCounts, setSectionVideoCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { currentLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  // Fetch sections from API
  const fetchSectionsAndCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch sections from API (axios, cookies included)
      const { data: sectionsData } = await api.get('/api/sections');
      setSections(sectionsData || []);
      
      // Use ad_count from backend instead of making multiple API calls
      const counts = {};
      for (const section of sectionsData) {
        counts[section.key] = section.ad_count || 0;
      }
      setSectionVideoCounts(counts);
      
    } catch (err) {
      console.error('❌ Failed to fetch sections:', err);
      setError(t('errors.failedToLoadSections'));
      setSections([]);
      setSectionVideoCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectionsAndCounts();
  }, [t]);

  const handleSectionClick = (sectionKey) => {
    navigate(`/viewer/section/${sectionKey}`);
  };

  // Map section keys to icons
  const getSectionIcon = (sectionKey) => {
    const iconMap = {
      restaurants: <Restaurant />,
      healthcare: <LocalHospital />,
      education: <School />,
      real_estate: <Home />,
      automotive: <DirectionsCar />,
      retail: <ShoppingCart />,
      entertainment: <SportsEsports />,
      beauty: <Spa />,
      finance: <AttachMoney />,
      technology: <Business />,
      travel: <TrendingUp />,
      services: <Business />
    };
    return iconMap[sectionKey] || <Business />;
  };

  // Process sections with icons and translations
  const businessSections = useMemo(() => sections.map(section => ({
    ...section,
    title: section.title, // Use title from API
    description: section.description, // Use description from API
    icon: getSectionIcon(section.key),
    color: section.color || '#1976d2', // Use color from API or default
    videosLabel: t('viewer.videos'),
    availableLabel: t('viewer.availableToWatch'),
    emptyLabel: t('viewer.noVideosAvailable')
  })), [sections, t]);

  return (
    <Box
      dir={isRTL ? 'rtl' : 'ltr'}
      sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'transparent',
        padding: { xs: 2, sm: 3, md: 4 },
        fontFamily: fontStack
      }}
    >
      {/* Credit Bar - Fixed in upright corner as per app requirements */}
      <CreditBar />
      
      {/* Header */}
      <Box
        sx={{
          textAlign: isRTL ? 'right' : 'left',
          mb: { xs: 3, md: 4 },
          maxWidth: 980,
          mx: 'auto'
        }}
      >
        <Typography 
          variant={isMobile ? 'h4' : 'h3'} 
          sx={{ 
            fontWeight: 700, 
            color: 'rgba(255,255,255,0.95)',
            mb: 1.5,
            fontFamily: fontStack
          }}
        >
          {t('viewer.welcomeTitle')}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ maxWidth: 720, fontFamily: fontStack, color: 'rgba(255,255,255,0.7)' }}
        >
          {t('viewer.welcomeSubtitle')}
        </Typography>
      </Box>

      {/* TikTok-style Tabs */}
      <Box
        sx={{ 
          width: '100%', 
          maxWidth: 820, 
          mx: 'auto', 
          mb: { xs: 3, md: 4 },
          backgroundColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          borderRadius: 3,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          TabIndicatorProps={{ sx: { height: 3, borderRadius: 2, bgcolor: '#60a5fa' } }}
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
              fontWeight: 600,
              textTransform: 'none',
              py: { xs: 1.5, sm: 1.75, md: 2 },
              fontFamily: fontStack,
              color: 'rgba(255,255,255,0.6)'
            },
            '& .Mui-selected': {
              color: '#93c5fd !important'
            }
          }}
        >
          <Tab 
            label={t('viewer.allAds')} 
            sx={{ 
              borderBottom: activeTab === 0 ? '3px solid #60a5fa' : 'none'
            }}
          />
          <Tab 
            label={t('viewer.sections')}
            sx={{ 
              borderBottom: activeTab === 1 ? '3px solid #60a5fa' : 'none'
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Fade in={activeTab === 0} timeout={240} unmountOnExit>
        <Box>
          <AllAdsTab />
        </Box>
      </Fade>

      <Fade in={activeTab === 1} timeout={240} unmountOnExit>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              mb: { xs: 2, md: 3 }, 
              textAlign: isRTL ? 'right' : 'left',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: 980,
              mx: 'auto',
              fontFamily: fontStack
            }}
          >
            {t('viewer.chooseSection')}
          </Typography>
          
          {loading ? (
            <LoadingState label={t('common.loading') || 'Loading...'} />
          ) : error ? (
            <ErrorState message={error} isRTL={isRTL} onRetry={() => {
              setLoading(true);
              setError(null); // Clear previous error
              fetchSectionsAndCounts(); // Re-fetch data
            }} />
          ) : businessSections.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ fontFamily: fontStack, color: 'rgba(255,255,255,0.8)' }}>
                {t('viewer.noBusinessSections')}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: fontStack, color: 'rgba(255,255,255,0.6)' }}>
                {t('viewer.checkBackLater')}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={isTablet ? 2.5 : 3}>
              {businessSections.map((section, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={section.key} sx={{ display: 'flex' }}>
                  <Grow in timeout={220 + index * 40}>
                    <Box sx={{ width: '100%', minHeight: 320 }}>
                      <SectionCard
                        section={section}
                        count={sectionVideoCounts[section.key]}
                        onClick={() => handleSectionClick(section.key)}
                        isRTL={isRTL}
                      />
                    </Box>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Fade>
    </Box>
  );
}