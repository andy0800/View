import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Button,
  useTheme,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

import { CreditContext } from '../contexts/CreditContext';
import { useNavigate, useParams } from 'react-router-dom';
import TikTokVideoPlayer from './TikTokVideoPlayer';
import CreditBar from './CreditBar';
import { getVideosBySection, completeWatchingAd } from '../api/viewer';

export default function SectionVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionInfo, setSectionInfo] = useState(null);
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const { sectionKey } = useParams();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { addCredit } = useContext(CreditContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (sectionKey) {
      fetchSectionVideos();
    }
  }, [sectionKey]);

  // Reset reward alert when videos change
  useEffect(() => {
    setShowRewardAlert(false);
  }, [videos]);

  const fetchSectionVideos = async () => {
    try {
      setLoading(true);
      console.log('🔍 SectionVideos: Fetching videos for section:', sectionKey);
      
      const response = await getVideosBySection(sectionKey);
      console.log('🔍 SectionVideos: API response:', response);
      
      if (response.success) {
        console.log(`✅ SectionVideos: Found ${response.videos?.length || 0} videos in section ${sectionKey}`);
        setVideos(response.videos || []);
        setSectionInfo(response.sectionInfo);
      } else {
        console.error('❌ SectionVideos: API returned error:', response.message);
        setError(response.message || t('errors.failedToLoadSectionVideos'));
      }
    } catch (err) {
      console.error('❌ SectionVideos: Failed to load section videos:', err);
      console.error('❌ SectionVideos: Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(t('errors.failedToLoadSectionVideos'));
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async (video) => {
    console.log('Video completed in SectionVideos (UI update only):', video);
    if (!video || !video.id) return;
    // UI-only; backend processing is done by the player
  };

  const handleEarnCredits = async (video, rewardAmount) => {
    console.log('Earning credits in SectionVideos (use provided reward):', video, rewardAmount);
    if (!video || !video.id) return;
    const reward = parseFloat(rewardAmount) || 0;
    if (reward > 0) {
      setRewardAmount(reward);
      setShowRewardAlert(true);
      addCredit(reward);
      setTimeout(() => setShowRewardAlert(false), 4000);
    }
  };

  const handleBackToSections = () => {
    navigate('/viewer');
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        flexDirection="column"
        gap={3}
      >
        <CircularProgress 
          size={isMobile ? 50 : 70} 
          color="primary"
          thickness={4}
        />
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          color="textSecondary"
          sx={{ fontWeight: 600 }}
        >
          {t('common.loading')} {sectionInfo?.title || sectionKey}...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToSections}
          sx={{ mb: 3 }}
        >
          {t('viewer.backToSections')}
        </Button>
        
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 3,
            '& .MuiAlert-message': {
              fontWeight: 600
            }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (videos.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToSections}
          sx={{ mb: 3 }}
        >
          {t('viewer.backToSections')}
        </Button>
        
        <Box textAlign="center" py={8}>
          <Typography 
            variant="h5" 
            color="textSecondary" 
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            {t('viewer.noVideosInSection')}
          </Typography>
          <Typography 
            variant="body1" 
            color="textSecondary"
            sx={{ fontWeight: 500 }}
          >
            {t('viewer.checkBackLater')}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default
    }}>
      {/* Back Button */}
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToSections}
          sx={{ mb: 3 }}
        >
          {t('viewer.backToSections')}
        </Button>
      </Box>

      {/* TikTok Video Player */}
      <TikTokVideoPlayer
        videos={videos}
        onVideoComplete={handleVideoComplete}
        onEarnCredits={handleEarnCredits}
      />

      {/* Reward Alert */}
      <Snackbar
        open={showRewardAlert}
        autoHideDuration={4000}
        onClose={() => setShowRewardAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowRewardAlert(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {t('viewer.rewardEarned', { amount: rewardAmount })}
        </Alert>
      </Snackbar>
    </Box>
  );
}
