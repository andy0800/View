import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Button, 
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  ArrowBack,
  Visibility,
  AttachMoney
} from '@mui/icons-material';
import { CreditContext } from "../contexts/CreditContext";
import CreditBar from "../components/CreditBar";
import ResponsiveLayout from '../components/ResponsiveLayout';
import { useTranslation } from 'react-i18next';

import api from '../api';


export default function VideoPage() {
  const { id: sectionKey, adId } = useParams();
  const navigate = useNavigate();
  const { addCredit } = useContext(CreditContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rewarding, setRewarding] = useState(false);
  const [isIndividualAd, setIsIndividualAd] = useState(false);
  
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    // Check if this is an individual ad or section-based viewing
    if (adId) {
      setIsIndividualAd(true);
      fetchIndividualAd();
    } else {
      setIsIndividualAd(false);
      fetchVideos();
    }
  }, [sectionKey, adId]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const fetchIndividualAd = async () => {
    try {
      setLoading(true);
      // For individual ad, we'll create a single-item array
      const response = await api.get(`/viewer/all-ads?page=1&limit=100`);
      const allAds = response.data.ads || [];
      const targetAd = allAds.find(ad => ad.id.toString() === adId);
      
      if (targetAd) {
        setVideos([targetAd]);
        setCurrentVideoIndex(0);
      } else {
        setError(t('errors.adNotFound'));
      }
    } catch (err) {
      console.error('Failed to load individual ad:', err);
      setError(t('errors.failedToLoadVideo'));
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/viewer/section/${sectionKey}/videos`);
      console.log('🔍 Videos API response:', response);
      console.log('🔍 Videos data:', response.data);
      console.log('🔍 Number of videos:', response.data?.length || 0);
      
      if (response.data && response.data.length > 0) {
        console.log('🔍 First video details:', {
          id: response.data[0].id,
          title: response.data[0].title,
          mediaUrl: response.data[0].mediaUrl,
          section: response.data[0].section
        });
      }
      
      setVideos(response.data || []);
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError(t('errors.failedToLoadVideos'));
    } finally {
      setLoading(false);
    }
  };

  const currentVideo = videos[currentVideoIndex];

  // Debug current video data
  useEffect(() => {
    if (currentVideo) {
      console.log('🔍 Current video data:', {
        id: currentVideo.id,
        title: currentVideo.title,
        mediaUrl: currentVideo.mediaUrl,
        section: currentVideo.section,
        section_title: currentVideo.section_title
      });
    }
  }, [currentVideo]);

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    startProgressTracking();
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    stopProgressTracking();
  };

  const handleVideoEnded = () => {
    setIsVideoFinished(true);
    setIsVideoPlaying(false);
    stopProgressTracking();
    setVideoProgress(100);
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setVideoProgress(progress);
        
        // Check if video is finished (99% or more)
        if (progress >= 99) {
          handleVideoEnded();
        }
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleNextVideo = async () => {
    if (!isVideoFinished || rewarding) return;

    try {
      setRewarding(true);
      setError('');

      console.log('🔍 Attempting to reward viewer for video:', {
        adId: currentVideo.id,
        sectionKey: sectionKey,
        videoTitle: currentVideo.title
      });

      // Reward the viewer for watching the video
      const rewardResponse = await api.post('/viewer/wallet/reward', {
        adId: currentVideo.id,
        sectionKey: sectionKey
      });

      console.log('✅ Reward response:', rewardResponse.data);

      // Add credit to the context
      if (rewardResponse.data.reward) {
        addCredit(rewardResponse.data.reward);
        console.log('✅ Credit added to context:', rewardResponse.data.reward);
      }

      // Move to next video
      if (currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(prev => prev + 1);
        setIsVideoFinished(false);
        setVideoProgress(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      } else {
        // All videos watched, go back to sections
        navigate('/viewer');
      }
    } catch (err) {
      console.error('❌ Failed to reward viewer:', err);
      console.error('❌ Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      // Enhanced error handling for fraud detection and other issues
      let errorMessage = 'Failed to process reward. Please try again.';
      
      if (err.response?.data?.fraudDetected) {
        const fraudReason = err.response.data.reason;
        let fraudMessage = 'Fraud detection triggered. ';
        
        switch (fraudReason) {
          case 'duplicate_view':
            fraudMessage += 'You have already watched this video.';
            break;
          case 'rapid_views':
            fraudMessage += 'Please wait between video views.';
            break;
          case 'ip_anomaly':
            fraudMessage += 'Suspicious IP activity detected.';
            break;
          case 'ua_anomaly':
            fraudMessage += 'Suspicious device activity detected.';
            break;
          default:
            fraudMessage += 'Please try again later.';
        }
        
        errorMessage = fraudMessage;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setRewarding(false);
    }
  };

  const handleBackToSections = () => {
    navigate('/viewer');
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="60vh"
          flexDirection="column"
          gap={2}
        >
          <LinearProgress 
            sx={{ 
              width: isMobile ? '80%' : '50%',
              height: 6,
              borderRadius: 3
            }} 
          />
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="textSecondary"
          >
            {t('common.loading')} {t('viewer.videos')}...
          </Typography>
        </Box>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            mx: isMobile ? 1 : 0
          }}
        >
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleBackToSections}
          sx={{ mx: isMobile ? 1 : 0 }}
        >
          {t('viewer.backToSections')}
        </Button>
      </ResponsiveLayout>
    );
  }

  if (videos.length === 0) {
    return (
      <ResponsiveLayout>
        <Box sx={{ textAlign: 'center', py: isMobile ? 4 : 6 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {t('viewer.noVideosInSection')}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleBackToSections}
            sx={{ mt: 2 }}
          >
            {t('viewer.backToSections')}
          </Button>
        </Box>
      </ResponsiveLayout>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Fixed Credit Bar */}
      <CreditBar />
      
      <ResponsiveLayout>
        {/* Header */}
        <Box sx={{ 
          mb: isMobile ? 2 : 3, 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 1 : 2,
          flexWrap: 'wrap'
        }}>
          <IconButton 
            onClick={handleBackToSections} 
            color="primary"
            sx={{ 
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.main'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h1"
            sx={{ fontWeight: 600 }}
          >
            {currentVideo?.section_title || t('viewer.businessVideos')}
          </Typography>
          <Chip 
            label={`${currentVideoIndex + 1} of ${videos.length}`}
            color="primary"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
          />
        </Box>

        {/* Video Player Card */}
        <Card 
          sx={{ 
            mb: isMobile ? 2 : 3,
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {currentVideo ? (
              <Box sx={{ position: 'relative' }}>
                {/* Debug info */}
                {console.log('🔍 VideoPage - Current video:', currentVideo)}
                
                {/* Video Element */}
                <video
                  ref={videoRef}
                  src={(() => {
                    // Direct URL construction to ensure it works
                    const mediaUrl = currentVideo.mediaUrl;
                    let videoUrl;
                    
                    if (mediaUrl.startsWith('http')) {
                      // If it's already a full URL, check if it needs the /uploads/ads/ path
                      if (mediaUrl.includes('localhost:4001/') && !mediaUrl.includes('/uploads/ads/')) {
                        // Extract the filename and add the correct path
                        const filename = mediaUrl.split('/').pop();
                        videoUrl = `http://localhost:4001/uploads/ads/${filename}`;
                      } else {
                        videoUrl = mediaUrl;
                      }
                    } else if (!mediaUrl.includes('/')) {
                      // If just filename, add the full path
                      videoUrl = `http://localhost:4001/uploads/ads/${mediaUrl}`;
                    } else {
                      // If already has path, use as is
                      videoUrl = `http://localhost:4001${mediaUrl}`;
                    }
                    
                    console.log('🔍 VideoPage - Video source (direct):', { 
                      mediaUrl, 
                      videoUrl,
                      currentVideo: currentVideo 
                    });
                    return videoUrl;
                  })()}
                  style={{ 
                    width: '100%', 
                    maxHeight: isMobile ? '50vh' : isTablet ? '60vh' : '70vh',
                    backgroundColor: '#000',
                    borderRadius: theme.shape.borderRadius
                  }}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                  onLoadStart={() => {
                    const videoUrl = (() => {
                      const mediaUrl = currentVideo.mediaUrl;
                      if (mediaUrl.startsWith('http') && mediaUrl.includes('localhost:4001/') && !mediaUrl.includes('/uploads/ads/')) {
                        const filename = mediaUrl.split('/').pop();
                        return `http://localhost:4001/uploads/ads/${filename}`;
                      }
                      return mediaUrl;
                    })();
                    console.log('🔍 Video load started for URL:', videoUrl);
                  }}
                  onLoadedData={() => {
                    const videoUrl = (() => {
                      const mediaUrl = currentVideo.mediaUrl;
                      if (mediaUrl.startsWith('http') && mediaUrl.includes('localhost:4001/') && !mediaUrl.includes('/uploads/ads/')) {
                        const filename = mediaUrl.split('/').pop();
                        return `http://localhost:4001/uploads/ads/${filename}`;
                      }
                      return mediaUrl;
                    })();
                    console.log('✅ Video data loaded successfully for URL:', videoUrl);
                  }}
                  onError={(e) => {
                    const videoUrl = (() => {
                      const mediaUrl = currentVideo.mediaUrl;
                      if (mediaUrl.startsWith('http') && mediaUrl.includes('localhost:4001/') && !mediaUrl.includes('/uploads/ads/')) {
                        const filename = mediaUrl.split('/').pop();
                        return `http://localhost:4001/uploads/ads/${filename}`;
                      }
                      return mediaUrl;
                    })();
                    console.error('❌ Video loading error:', e);
                    console.error('❌ Video URL:', videoUrl);
                    console.error('❌ Video element:', e.target);
                    setError(t('errors.failedToLoadVideo'));
                  }}
                  controls
                />
                
                {/* Progress Bar */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0,
                  borderRadius: theme.shape.borderRadius
                }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={videoProgress} 
                    sx={{ 
                      height: 6,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'success.main',
                        borderRadius: theme.shape.borderRadius
                      }
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                p: isMobile ? 3 : 4, 
                textAlign: 'center' 
              }}>
                <Typography variant="h6" color="textSecondary">
                  {t('viewer.noVideoAvailable')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Video Info */}
        {currentVideo && (
          <Card 
            sx={{ 
              mb: isMobile ? 2 : 3,
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <CardContent>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {currentVideo.title || t('viewer.businessAdvertisement')}
              </Typography>
              
              <Typography 
                variant={isMobile ? "body2" : "body1"} 
                color="textSecondary" 
                paragraph
                sx={{ mb: 2 }}
              >
                {currentVideo.description || t('viewer.watchToEarn')}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                gap: isMobile ? 1 : 2, 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  backgroundColor: 'grey.100',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2
                }}>
                  <Visibility color="action" sx={{ fontSize: isMobile ? 16 : 20 }} />
                  <Typography variant={isMobile ? "caption" : "body2"}>
                    {t('viewer.viewCount', { count: currentVideo.views || 0 })}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  backgroundColor: 'success.light',
                  color: 'success.contrastText',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2
                }}>
                  <AttachMoney color="inherit" sx={{ fontSize: isMobile ? 16 : 20 }} />
                  <Typography 
                    variant={isMobile ? "caption" : "body2"} 
                    color="inherit"
                    sx={{ fontWeight: 500 }}
                  >
                    {t('viewer.earnAmount')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Next Button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mb: isMobile ? 2 : 3
        }}>
          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            startIcon={<SkipNext />}
            onClick={handleNextVideo}
            disabled={!isVideoFinished || rewarding}
            sx={{ 
              minWidth: isMobile ? 180 : 200,
              py: isMobile ? 1 : 1.5,
              fontSize: isMobile ? '1rem' : '1.1rem',
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8]
              }
            }}
          >
            {rewarding ? t('viewer.processingReward') : 
              isVideoFinished ? t('viewer.nextVideo') : 
              t('viewer.watchFullVideoToContinue')}
          </Button>
        </Box>

        {/* Instructions */}
        <Box sx={{ 
          textAlign: 'center',
          px: isMobile ? 2 : 0
        }}>
          <Typography 
            variant={isMobile ? "caption" : "body2"} 
            color="textSecondary"
            sx={{
              backgroundColor: 'info.light',
              color: 'info.contrastText',
              p: isMobile ? 1.5 : 2,
              borderRadius: 2,
              display: 'inline-block'
            }}
          >
            💡 <strong>{t('viewer.tip')}:</strong> {t('viewer.watchFullVideoTip')}
          </Typography>
        </Box>
      </ResponsiveLayout>
    </Box>
  );
}