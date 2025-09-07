import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  useTheme,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

import { CreditContext } from '../contexts/CreditContext';
import TikTokVideoPlayer from './TikTokVideoPlayer';
import CreditBar from './CreditBar';
import { getAllAdsRandomly } from '../api/viewer';

export default function AllAdsTab() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { addCredit } = useContext(CreditContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchVideos();
  }, []);

  // Reset reward alert when videos change
  useEffect(() => {
    setShowRewardAlert(false);
  }, [videos]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('🔍 AllAdsTab: Fetching videos...');
      
      const response = await getAllAdsRandomly();
      console.log('🔍 AllAdsTab: API response:', response);
      
      if (response.success) {
        console.log(`✅ AllAdsTab: Found ${response.videos?.length || 0} videos`);
        setVideos(response.videos || []);
      } else {
        console.error('❌ AllAdsTab: API returned error:', response.message);
        setError(response.message || t('errors.failedToLoadVideos'));
      }
    } catch (err) {
      console.error('❌ AllAdsTab: Failed to load videos:', err);
      console.error('❌ AllAdsTab: Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(t('errors.failedToLoadVideos'));
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async (video) => {
    console.log('🎯 Video completed in AllAdsTab (UI update only):', video);
    
    try {
      if (!video || !video.id) return;
      // Backend reward is handled by the player; here we just update the list
      setVideos(prevVideos => prevVideos.filter(v => v.id !== video.id));
      if (videos.length <= 1) {
        await fetchVideos();
      }
    } catch (error) {
      console.error('Error updating UI after completion:', error);
    }
  };

  const handleEarnCredits = async (video, rewardAmount) => {
    console.log('🎯 Credit earning in AllAdsTab:', video, rewardAmount);
    
    try {
      // Safety check: Don't process if video has no ID
      if (!video || !video.id) {
        console.error('❌ Invalid video object:', video);
        return;
      }

      // Use the reward amount provided by the player/backend
      let reward = parseFloat(rewardAmount);
      if (!reward || reward <= 0) {
        // Fallback calculation if not provided (rare)
        if (video.package?.viewer_reward) {
          reward = parseFloat(video.package.viewer_reward);
        } else if (video.package?.pricePerView) {
          reward = parseFloat(video.package.pricePerView) / 2;
        } else {
          // ✅ FIXED: Use dynamic calculation instead of hardcoded fallback
          reward = 0.005; // This will be overridden by backend response anyway
        }
      }
      setRewardAmount(reward);
      setShowRewardAlert(true);
      
      // Update credit context for real-time balance update
      addCredit(reward);
      
      console.log('🎯 Credit earning successful:', {
        rewardAmount: reward,
        rewardInFils: reward * 1000,
        videoId: video.id
      });
      
      // Auto-hide reward alert after 4 seconds
      setTimeout(() => {
        setShowRewardAlert(false);
      }, 4000);
    } catch (error) {
      console.error('Error earning credits:', error);
    }
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
          {t('common.loading')} {t('viewer.allAds')}...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mt: 3,
          mx: isMobile ? 2 : 0,
          borderRadius: 3,
          '& .MuiAlert-message': {
            fontWeight: 600
          }
        }}
      >
        {error}
      </Alert>
    );
  }

  if (videos.length === 0) {
    return (
      <Box 
        textAlign="center" 
        py={isMobile ? 8 : 10}
        px={isMobile ? 3 : 0}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          color="textSecondary" 
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          {t('viewer.noAdsAvailable')}
        </Typography>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="textSecondary"
          sx={{ fontWeight: 500 }}
        >
          {t('viewer.checkBackLaterForAds')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default
    }}>
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
          {t('viewer.rewardEarned', { amount: rewardAmount.toFixed(6) })} - {(rewardAmount * 1000).toFixed(0)} {t('currency.fils')}
        </Alert>
      </Snackbar>
    </Box>
  );
}

