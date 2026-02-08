import React, { useState, useEffect } from 'react';
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
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
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
import { motion } from 'framer-motion';
import { fadeIn, motionTokens } from '../theme/motion';
import AllAdsTab from '../components/AllAdsTab';
import CreditBar from '../components/CreditBar';
import api, { } from '../api';
import { getVideosBySection } from '../api/viewer';

// Simple Error Component
const ErrorComponent = ({ message, onRetry }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" color="error" gutterBottom>
      {message}
    </Typography>
    <Button
      variant="outlined"
      startIcon={<Refresh />}
      onClick={onRetry}
      sx={{ mt: 2 }}
    >
      Try Again
    </Button>
  </Box>
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
  const businessSections = sections.map(section => ({
    ...section,
    title: section.title, // Use title from API
    description: section.description, // Use description from API
    icon: getSectionIcon(section.key),
    color: section.color || '#1976d2' // Use color from API or default
  }));

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ duration: motionTokens.normal, ease: motionTokens.ease }}
      sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default',
        backgroundImage: 'radial-gradient(circle at top, rgba(229,9,20,0.12), transparent 45%)',
        padding: isMobile ? 2 : 4
      }}
    >
      {/* Credit Bar - Fixed in upright corner as per app requirements */}
      <CreditBar />
      
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant={isMobile ? 'h4' : 'h3'} 
          sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            mb: 2
          }}
        >
          {t('viewer.welcomeTitle')}
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          {t('viewer.welcomeSubtitle')}
        </Typography>
      </Box>

      {/* TikTok-style Tabs */}
      <Box sx={{ 
        width: '100%', 
        maxWidth: 600, 
        mx: 'auto', 
        mb: 4,
        backgroundColor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              py: 2,
              color: 'text.secondary'
            },
            '& .Mui-selected': {
              color: 'primary.main'
            }
          }}
        >
          <Tab 
            label={t('viewer.allAds')} 
            sx={{ 
              borderBottom: activeTab === 0 ? `3px solid ${theme.palette.primary.main}` : 'none'
            }}
          />
          <Tab 
            label={t('viewer.sections')}
            sx={{ 
              borderBottom: activeTab === 1 ? `3px solid ${theme.palette.primary.main}` : 'none'
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <AllAdsTab />
      )}

      {activeTab === 1 && (
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              mb: 3, 
              textAlign: 'center',
              color: theme.palette.text.primary
            }}
          >
            {t('viewer.chooseSection')}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <ErrorComponent message={error} onRetry={() => {
              setLoading(true);
              setError(null); // Clear previous error
              fetchSectionsAndCounts(); // Re-fetch data
            }} />
          ) : businessSections.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                {t('viewer.noBusinessSections')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('viewer.checkBackLater')}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
            {businessSections.map((section) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={section.key}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 20px 50px rgba(229,9,20,0.15)'
                    }
                  }}
                  onClick={() => handleSectionClick(section.key)}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 120,
                      backgroundColor: section.color || theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <Box sx={{ fontSize: 48 }}>
                      {section.icon}
                    </Box>
                  </CardMedia>
                  
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 1,
                        color: theme.palette.text.primary
                      }}
                    >
                      {section.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, minHeight: 40 }}
                    >
                      {section.description}
                    </Typography>

                    {/* Video Count Badge */}
                    <Chip
                      label={`${sectionVideoCounts[section.key] || 0} ${t('viewer.videos')}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        borderColor: section.color || theme.palette.primary.main,
                        color: section.color || theme.palette.primary.main
                      }}
                    />
                    
                    {/* Additional Info */}
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'block', 
                        mt: 1,
                        opacity: 0.7
                      }}
                    >
                      {sectionVideoCounts[section.key] > 0 
                        ? t('viewer.availableToWatch')
                        : t('viewer.noVideosAvailable')
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
}