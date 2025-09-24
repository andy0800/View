import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  LinearProgress,
  Button,
  Chip,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  PlayArrow, 
  SkipNext, 
  VolumeUp, 
  VolumeOff,
  Fullscreen,
  AttachMoney,
  Business,
  CheckCircle,
  ChatBubbleOutline,
  OpenInNew,
  InfoOutlined,
  Visibility,
  Lock
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';

import { startWatchingAd, completeWatchingAd } from '../api/viewer';
import api from '../api';
import { devLog, devError, safeError } from '../utils/consoleUtils';

// Error Boundary Component
class VideoPlayerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      safeError('Video Player Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          backgroundColor: '#000',
          color: 'white',
          padding: '20px'
        }}>
          <Typography variant="h5" component="div" sx={{ mb: 2, color: '#ff6b6b' }}>
            {this.props.t?.('viewer.errorOccurred') || 'Something went wrong'}
          </Typography>
          <Typography variant="body1" component="div" sx={{ mb: 3, textAlign: 'center' }}>
            {this.props.t?.('viewer.videoPlayerError') || 'The video player encountered an error. Please refresh the page to try again.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ backgroundColor: '#4CAF50' }}
          >
            {this.props.t?.('common.refresh') || 'Refresh Page'}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default function TikTokVideoPlayer({ videos, onVideoComplete, onEarnCredits }) {
  // CSS animations for floating credit bar and CTA button
  const creditBarStyles = `
    @keyframes creditBarFloat {
      0%, 100% { transform: translateX(-50%) translateY(0px); }
      50% { transform: translateX(-50%) translateY(-5px); }
    }
    
    @keyframes creditIconGlow {
      0% { filter: drop-shadow(0 0 5px rgba(76, 175, 80, 0.5)); }
      100% { filter: drop-shadow(0 0 15px rgba(76, 175, 80, 0.8)); }
    }
    
    @keyframes creditDotPulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 1;
      }
      50% { 
        transform: scale(1.2);
        opacity: 0.7;
      }
    }
    
    @keyframes ctaButtonPulse {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 0 8px 32px rgba(255, 64, 129, 0.4);
      }
      50% { 
        transform: scale(1.05);
        box-shadow: 0 12px 40px rgba(255, 64, 129, 0.6);
      }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Default muted to allow autoplay across browsers
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(false);
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [processedVideos, setProcessedVideos] = useState(new Set()); // Track processed videos
  
  // ✅ OPTIMIZED: Use only refs for proof tokens (no re-renders needed)
  const currentProofTokenRef = useRef(null);
  const viewStartTimeRef = useRef(null);
  
  // New states for CTA and comments
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingReward, setIsProcessingReward] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  
  // ✅ OPTIMIZED: Memoize expensive calculations
  const currentVideo = useMemo(() => videos[currentVideoIndex], [videos, currentVideoIndex]);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Debug logging
  console.log('🎬 TikTokVideoPlayer render:', { 
    currentVideoIndex, 
    videosLength: videos.length, 
    currentVideo,
    hasMediaUrl: currentVideo?.mediaUrl 
  });
  
  const videoReward = useMemo(() => {
    const base = currentVideo?.package?.viewer_reward || 
           (currentVideo?.package?.pricePerView ? (currentVideo.package.pricePerView / 2).toFixed(6) : '0.005');
    // If this ad was already watched, show 0 reward to indicate rewatching has no reward
    return currentVideo?.is_watched ? '0.000' : base;
  }, [currentVideo]);
  
  // Function to fetch comment count for current video with enhanced error handling
  const fetchCommentCount = useCallback(async (videoId, retryCount = 0) => {
    if (!videoId) return;
    
    try {
      // Set loading state for comment fetching
      setIsLoading(true);
      
      // Use the authenticated api instance with timeout
      const response = await api.get(`/api/comments/ad/${videoId}/stats`, {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.data.success) {
        setCommentCount(response.data.data.total_comments || 0);
      } else {
        // Handle API response indicating failure
        throw new Error(response.data.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      devLog('Could not fetch comment count:', {
        error: error.message,
        status: error.response?.status,
        code: error.code,
        videoId: videoId,
        retryCount: retryCount,
        timestamp: new Date().toISOString()
      });
      
      // Retry logic for network errors
      if (retryCount < 2 && (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || error.response?.status >= 500)) {
        devLog(`Retrying comment count fetch for video ${videoId}, attempt ${retryCount + 2}/3`);
        setTimeout(() => {
          fetchCommentCount(videoId, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Set fallback comment count for certain error types
      if (error.response?.status === 404 || error.response?.status === 403) {
        setCommentCount(0); // Video likely has no comments or access denied
      }
      // For other errors, keep current count to avoid UI flickering
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  }, []);
  
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Auto-play first video and fetch comment count
  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex === 0) {
      setIsPlaying(true);
      setIsWatching(true);
      setCanSkip(false);
      setRewardEarned(false);
      setShowRewardAlert(false); // Reset reward alert
      setProcessedVideos(new Set()); // Reset processed videos for new video set
      
      // Start watching the first video
      startVideoWatching(videos[0]);
      
      // Fetch comment count for first video
      if (videos[0]?.id) {
        fetchCommentCount(videos[0].id);
      }
    }
  }, [videos, currentVideoIndex, fetchCommentCount]);

  // Reset reward alert when videos change
  useEffect(() => {
    setShowRewardAlert(false);
    setRewardEarned(false);
    setProcessedVideos(new Set()); // Reset processed videos for new video set
  }, [videos]);
  
  // Fetch comment count when current video changes
  useEffect(() => {
    if (currentVideo?.id) {
      fetchCommentCount(currentVideo.id);
    } else {
      // Reset comment count when no video is selected
      setCommentCount(0);
    }
  }, [currentVideo?.id, fetchCommentCount]);

  // Function to start watching a video (creates proof token)
  const startVideoWatching = useCallback(async (video) => {
    try {
      setIsLoading(true);
      devLog('🎬 Starting to watch video:', video.id);
      // If already watched, skip creating a new rewarded view event
      if (video?.is_watched) {
        devLog('🔁 Re-watching already rewarded ad - no new reward event will be created');
        setIsWatching(true);
        setCanSkip(false);
        currentProofTokenRef.current = null;
        viewStartTimeRef.current = Date.now();
        return;
      }
      const response = await startWatchingAd(video.id);
      
      if (response.success) {
        const proofToken = response.viewEvent.proofToken;
        const startTime = Date.now();
        
        // ✅ OPTIMIZED: Only use refs, no state updates
        currentProofTokenRef.current = proofToken;
        viewStartTimeRef.current = startTime;
        
        devLog('✅ Video watching started with proof token:', proofToken);
      } else {
        devError('❌ Failed to start video watching:', response.message);
      }
    } catch (error) {
      devError('❌ Error starting video watching:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ OPTIMIZED: Single event handler with proper cleanup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleEnded = () => {
      devLog('🎬 Video ended event triggered');
      if (!rewardEarned) {
        devLog('🎯 Video ended - waiting for user to click NEXT');
        // ✅ FIXED: Set completion state and enable NEXT button
        setRewardEarned(true);
        setIsPlaying(false);
        setCanSkip(true);
        setIsWatching(false);
        
        // Mark video as ready for completion processing
        devLog('🎯 Video marked as ready for NEXT button processing');
        devLog('🔍 State after video ended - rewardEarned:', true, 'canSkip:', true, 'isPlaying:', false);
      } else {
        devLog('🛑 Video already completed, ignoring ended event');
      }
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= video.duration - 0.1 && !rewardEarned) {
        devLog('🎯 Time update completion detected - video ready for completion');
        // ✅ FIXED: Don't auto-advance, just mark as ready
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentVideoIndex, rewardEarned]);

  // ✅ OPTIMIZED: Handle video progress with proper interval management
  useEffect(() => {
    let intervalId = null;
    
    if (isPlaying && videoRef.current && !rewardEarned) {
      intervalId = setInterval(() => {
        if (videoRef.current && !rewardEarned) {
          const currentTime = videoRef.current.currentTime;
          const duration = videoRef.current.duration;
          
          if (duration > 0) {
            const newProgress = (currentTime / duration) * 100;
            setProgress(newProgress);
            
            // ✅ FIXED: Only detect completion, don't auto-advance
            if (newProgress >= 99.5 && !rewardEarned) {
              devLog('🎯 Progress-based completion detected - video ready for completion');
              // Don't call handleVideoComplete here - let user click NEXT
            }
          }
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, rewardEarned]);

  const handleVideoComplete = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        devLog('🎯 Video completed! Processing reward...');
        devLog('🔍 Current state - rewardEarned:', rewardEarned, 'currentProofToken:', currentProofTokenRef.current ? 'present' : 'null');
        devLog('🎯 Processing video completion for reward...');
        devLog('📊 Video details:', {
          id: currentVideo?.id,
          title: currentVideo?.title,
          package: currentVideo?.package?.name,
          duration: currentVideo?.package?.duration
        });
      }
      
      // Set loading state for reward processing
      setIsProcessingReward(true);
      
      // ✅ FIXED: Allow processing even if rewardEarned is true (for NEXT button clicks)
      // The rewardEarned state is set when video ends, but processing happens on NEXT click
      
      // Check if this video has already been processed
      if (processedVideos.has(currentVideo.id)) {
        devLog('🎯 Video already processed, skipping:', currentVideo.id);
        return;
      }
      
      // Check if we have a valid proof token (use ref as fallback)
      // If re-watching, do not call backend completion or show reward
      if (currentVideo?.is_watched) {
        devLog('🔁 Completing re-watch without reward');
        if (onVideoComplete) {
          try {
            await onVideoComplete(currentVideo);
          } catch (e) {}
        }
        // Advance to next video
        setProcessedVideos(prev => new Set([...prev, currentVideo.id]));
        if (currentVideoIndex < videos.length - 1) {
          advanceToNextVideo();
        } else {
          setShowCompletionMessage(true);
        }
        return;
      }
      const proofToken = currentProofTokenRef.current;
      const startTime = viewStartTimeRef.current;
      
      if (!proofToken) {
        devError('❌ No proof token available for video completion');
        devLog('🔍 Debug - currentProofTokenRef:', currentProofTokenRef.current);
        
        // ✅ ENHANCED: Try to regenerate proof token for P15/P20 ads
        if (currentVideo?.package?.duration === 15 || currentVideo?.package?.duration === 20) {
          devLog('🔄 Attempting to regenerate proof token for P15/P20 ad...');
          try {
            await startVideoWatching(currentVideo);
            const newProofToken = currentProofTokenRef.current;
            if (newProofToken) {
              devLog('✅ Successfully regenerated proof token:', newProofToken);
              // Continue with the new token
            } else {
              devError('❌ Failed to regenerate proof token');
              return;
            }
          } catch (error) {
            devError('❌ Error regenerating proof token:', error);
            return;
          }
        } else {
          return;
        }
      }
      
      // Calculate watched duration in milliseconds
      const watchedDurationMs = startTime ? Date.now() - startTime : 0;
      
      // Set basic completion state IMMEDIATELY to prevent further completion events
      setIsPlaying(false);
      setCanSkip(true);
      setIsWatching(false);
      setRewardEarned(true); // Set this early to prevent multiple calls
      
      // Immediately pause the video to prevent further progress
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = videoRef.current.duration; // Ensure video is at the end
      }
      
      // ✅ FIXED: Don't calculate reward here - wait for backend response
      devLog('🎯 Video completion - waiting for backend reward calculation...');
      
      // ✅ ENHANCED: Add retry logic for P15/P20 ads
      let retryCount = 0;
      const maxRetries = 3;
      let lastError = null;
      
      while (retryCount < maxRetries) {
        try {
          devLog(`🔄 Attempt ${retryCount + 1} of ${maxRetries} for video completion`);
          
          const response = await completeWatchingAd(currentVideo.id, proofToken, watchedDurationMs);
          
          if (response.success) {
            devLog('✅ Backend reward processing successful:', response);
            
            // ✅ FIXED: Use backend response for reward amount
            const backendReward = parseFloat(response.reward || 0);
            setRewardAmount(backendReward);
            
            devLog('🎯 Backend reward received:', {
              reward: backendReward,
              rewardInFils: backendReward * 1000,
              newBalance: response.newBalance
            });
            
            // Show reward alert with correct amount
            setShowRewardAlert(true);
            devLog('🎯 Video completion successful');
            
            // Auto-hide reward alert after 4 seconds
            setTimeout(() => {
              setShowRewardAlert(false);
            }, 4000);
            
            // Trigger rewards callbacks
            if (onVideoComplete) {
              try {
                await onVideoComplete(currentVideo);
                devLog('Video completion callback successful');
              } catch (error) {
                devError('Error in video completion callback:', error);
                // Don't proceed with credit earning if completion callback fails
                return;
              }
            }
            
            // Call onEarnCredits only if completion was successful
            if (onEarnCredits && backendReward > 0) {
              try {
                await onEarnCredits(currentVideo, backendReward);
                devLog('Credit earning callback successful');
              } catch (error) {
                devError('Error in credit earning callback:', error);
              }
            }
            
            // ✅ FIXED: Mark video as processed AFTER successful backend processing
            setProcessedVideos(prev => new Set([...prev, currentVideo.id]));
            if (process.env.NODE_ENV === 'development') {
              devLog('🎯 Video marked as processed successfully');
            }
            
            // Success - break out of retry loop
            break;
            
          } else {
            devError('❌ Backend reward processing failed:', response.message);
            lastError = new Error(response.message);
            retryCount++;
            
            if (retryCount < maxRetries) {
              devLog(`⏳ Retrying in 1 second... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
          
        } catch (error) {
          devError(`❌ Error processing video completion (attempt ${retryCount + 1}):`, error);
          lastError = error;
          retryCount++;
          
          // Check if it's an "already watched" error
          if (error.response?.status === 200 && error.response?.data?.alreadyWatched) {
            devLog('🎯 Video already watched - no action needed');
            break;
          }
          
          // ✅ ENHANCED: Check for expired/invalid proof token (400 error)
          if (error.response?.status === 400) {
            devError('❌ Bad request error during video completion:', error.response.data);
            
            // Check if it's a proof token issue
            if (error.response.data?.message?.toLowerCase().includes('token') || 
                error.response.data?.message?.toLowerCase().includes('expired') ||
                error.response.data?.message?.toLowerCase().includes('invalid')) {
              devLog('🚨 Proof token expired or invalid - attempting token refresh...');
              
              // Try to regenerate proof token for P15/P20 ads
              if (currentVideo?.package?.duration === 15 || currentVideo?.package?.duration === 20) {
                try {
                  devLog('🔄 Regenerating proof token for P15/P20 ad...');
                  await startVideoWatching(currentVideo);
                  const newProofToken = currentProofTokenRef.current;
                  if (newProofToken) {
                    devLog('✅ Successfully regenerated proof token, retrying completion...');
                    proofToken = newProofToken; // Update the proof token for retry
                    if (retryCount < maxRetries) {
                      devLog(`⏳ Retrying with new token in 1 second... (${retryCount}/${maxRetries})`);
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      continue;
                    }
                  } else {
                    devError('❌ Failed to regenerate proof token');
                  }
                } catch (refreshError) {
                  devError('❌ Error regenerating proof token:', refreshError);
                }
              }
            }
            
            // Don't show reward alert for token errors
            break;
          }
          
          // Check if it's a 500 error (server issue)
          if (error.response?.status === 500) {
            devError('❌ Server error during video completion:', error.response.data);
            
            // ✅ ENHANCED: Special handling for P15/P20 server errors
            if (currentVideo?.package?.duration === 15 || currentVideo?.package?.duration === 20) {
              devLog('🔄 P15/P20 ad server error - attempting recovery...');
              if (retryCount < maxRetries) {
                devLog(`⏳ Retrying P15/P20 ad in 2 seconds... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }
            }
            
            // Don't show reward alert for server errors
            break;
          }
          
          if (retryCount < maxRetries) {
            devLog(`⏳ Retrying in 1 second... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If all retries failed, show error
      if (retryCount >= maxRetries && lastError) {
        devError('❌ All retry attempts failed for video completion');
        
        // ✅ ENHANCED: Special error handling for P15/P20 ads
        if (currentVideo?.package?.duration === 15 || currentVideo?.package?.duration === 20) {
          devError('🚨 CRITICAL: P15/P20 ad completion failed after all retries');
          devError('🔍 This suggests a deeper issue with these package types');
          
          // Try to reset the video state for manual retry
          setCanSkip(false);
          setRewardEarned(false);
          setIsPlaying(true);
          setIsWatching(true);
          
          // Show user-friendly error message
          devError('💡 User should try refreshing the page or restarting the video');
        }
      }
    } finally {
      // Always reset loading state
      setIsProcessingReward(false);
    }
  }, [currentVideo, processedVideos, rewardEarned, onVideoComplete, onEarnCredits]);

  const handleNextVideo = useCallback(() => {
    devLog('🔄 handleNextVideo called - currentVideoIndex:', currentVideoIndex, 'videos.length:', videos.length, 'canSkip:', canSkip);
    
    // Only allow next video if canSkip is true
    if (!canSkip) {
      devLog('🚫 Cannot skip to next video - must complete current video first');
      return;
    }
    
    // ✅ FIXED: Process video completion when NEXT button is clicked
    if (rewardEarned && !processedVideos.has(currentVideo.id)) {
      devLog('🎯 Processing video completion for NEXT button click');
      // Process completion synchronously and then handle result
      handleVideoComplete().then(() => {
        // After completion is processed, handle navigation
        if (currentVideoIndex < videos.length - 1) {
          // More videos available - advance to next
          advanceToNextVideo();
        } else {
          // Last video - show completion message
          devLog('🎉 Last video completed successfully!');
          setShowCompletionMessage(true);
        }
      }).catch((error) => {
        devError('❌ Error processing video completion:', error);
        // Even if there's an error, handle navigation
        if (currentVideoIndex < videos.length - 1) {
          advanceToNextVideo();
        }
      });
    } else if (rewardEarned && processedVideos.has(currentVideo.id)) {
      // Video already processed, handle navigation
      devLog('🎯 Video already processed, handling navigation');
      if (currentVideoIndex < videos.length - 1) {
        advanceToNextVideo();
      } else {
        devLog('🎉 Last video already completed!');
        setShowCompletionMessage(true);
      }
    } else {
      devLog('🚫 Video not ready for advancement');
    }
  }, [canSkip, rewardEarned, currentVideo, processedVideos, currentVideoIndex, videos.length, handleVideoComplete]);

  // ✅ OPTIMIZED: Separate function for advancing to next video
  const advanceToNextVideo = useCallback(() => {
    if (currentVideoIndex < videos.length - 1) {
      devLog('🔄 Moving to next video, resetting proof token');
    
      // ✅ CRITICAL: This is the ONLY place where video index should advance
      setCurrentVideoIndex(prev => prev + 1);
      
      // Reset all states for the new video
      setProgress(0);
      setCanSkip(false);
      setIsPlaying(true);
      setIsWatching(true);
      setRewardEarned(false);
      setShowRewardAlert(false); // Reset reward alert for new video
      setShowCompletionMessage(false); // Reset completion message for new video
      
      // ✅ OPTIMIZED: Don't reset processedVideos - preserve progress tracking
      // setProcessedVideos(new Set()); ❌ REMOVED: Preserve processed videos
      
      // ✅ OPTIMIZED: Only reset refs for new video
      currentProofTokenRef.current = null; // Reset proof token ref
      viewStartTimeRef.current = null; // Reset view start time ref
      
      // Start watching the new video
      startVideoWatching(videos[currentVideoIndex + 1]);
      
      devLog('✅ Successfully advanced to next video');
    } else {
      devLog('🎬 Already at the last video');
    }
  }, [currentVideoIndex, videos, startVideoWatching]);

  const handlePreviousVideo = useCallback(() => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      setProgress(0);
      setCanSkip(false);
      setIsPlaying(true);
      setIsWatching(true);
      setRewardEarned(false);
      setShowRewardAlert(false); // Reset reward alert for new video
      setShowCompletionMessage(false); // Reset completion message for new video
      
      // ✅ OPTIMIZED: Don't reset processedVideos - preserve progress tracking
      // setProcessedVideos(new Set()); ❌ REMOVED: Preserve processed videos
      
      // ✅ OPTIMIZED: Only reset refs for new video
      currentProofTokenRef.current = null; // Reset proof token ref
      viewStartTimeRef.current = null; // Reset view start time ref
      
      // Start watching the new video
      startVideoWatching(videos[currentVideoIndex - 1]);
    }
  }, [currentVideoIndex, videos, startVideoWatching]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current && !isLoading) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying, isLoading]);

  const toggleMute = useCallback(() => {
    if (videoRef.current && !isLoading) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted, isLoading]);

  const handleVideoClick = useCallback(() => {
    if (!isLoading) {
      togglePlayPause();
    }
  }, [togglePlayPause, isLoading]);

  const formatDuration = useCallback((seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!currentVideo) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" component="div" color="textSecondary">
          {t('common.noVideosAvailable')}
        </Typography>
      </Box>
    );
  }

  return (
    <VideoPlayerErrorBoundary t={t}>
      <style>{creditBarStyles}</style>
      <Box sx={{ 
        position: 'relative', 
        height: '100vh', '@media (min-width: 600px)': { height: '100vh' }, '@media (min-width: 960px)': { height: '100vh' },
        backgroundColor: '#000',
        overflow: 'hidden'
      }}>
      {/* Main Video Player */}
      <Box sx={{ 
        position: 'relative', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        {currentVideo && currentVideo.mediaUrl && (
          <video
            ref={videoRef}
            src={(() => {
              // Direct URL construction to ensure it works
              const mediaUrl = currentVideo.mediaUrl;
              let videoUrl;
              
              const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://viewapp-backend.onrender.com';
              if (mediaUrl.startsWith('http')) {
                // If it's already a full URL, check if it needs the /uploads/ads/ path
                if (mediaUrl.includes('localhost:4001/') && !mediaUrl.includes('/uploads/ads/')) {
                  // Extract the filename and add the correct path
                  const filename = mediaUrl.split('/').pop();
                  videoUrl = `${backendUrl}/uploads/ads/${filename}`;
                } else {
                  videoUrl = mediaUrl;
                }
              } else if (!mediaUrl.includes('/')) {
                // If just filename, add the full path
                videoUrl = `${backendUrl}/uploads/ads/${mediaUrl}`;
              } else {
                // If already has path, use as is
                videoUrl = `${backendUrl}${mediaUrl}`;
              }
              
              console.log('🎬 Video source (direct):', { 
                mediaUrl, 
                videoUrl,
                currentVideo: currentVideo 
              });
              return videoUrl;
            })()}
            crossOrigin="anonymous"
            preload="auto"
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            onClick={handleVideoClick}
            autoPlay={isPlaying}
            muted={isMuted}
            loop={false}
            aria-label={`${currentVideo.title || 'Video'} - ${t('viewer.videoPlayer') || 'Video Player'}`}
            role="application"
            aria-describedby="video-description"
            onLoadStart={() => setIsVideoLoading(true)}
            onCanPlay={() => setIsVideoLoading(false)}
            onError={(e) => {
              console.error('🎬 Video error:', e);
              setIsVideoLoading(false);
            }}
            // ✅ OPTIMIZED: Remove onEnded - handled in useEffect
          />
        )}
        
        {/* Video Description for Screen Readers */}
        <div id="video-description" className="sr-only">
          {t('viewer.videoDescription', { 
            title: currentVideo.title || 'Video',
            duration: formatDuration(currentVideo.package?.duration || currentVideo.duration || 10),
            reward: videoReward
          }) || `${currentVideo.title || 'Video'} with ${formatDuration(currentVideo.package?.duration || currentVideo.duration || 10)} duration and ${videoReward} KWD reward`}
        </div>
        
        {/* Video Loading Overlay */}
        {isVideoLoading && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '16px', '@media (min-width: 600px)': { padding: '18px' }, '@media (min-width: 960px)': { padding: '20px' },
            borderRadius: '8px', '@media (min-width: 600px)': { borderRadius: '9px' }, '@media (min-width: 960px)': { borderRadius: '10px' },
            width: '90vw', '@media (min-width: 600px)': { width: '85vw' }, '@media (min-width: 960px)': { width: 'auto' },
            maxWidth: '350px', '@media (min-width: 600px)': { maxWidth: '400px' }, '@media (min-width: 960px)': { maxWidth: 'none' }
          }}>
            <Box sx={{ animation: 'spin 1s linear infinite', mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 } }}>
              <PlayArrow sx={{ 
                fontSize: 32, 
                color: '#4CAF50',
                '@media (min-width: 600px)': { fontSize: 36 },
                '@media (min-width: 960px)': { fontSize: 40 }
              }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ 
              color: 'white',
              fontSize: '1rem',
              '@media (min-width: 600px)': { fontSize: '1.125rem' },
              '@media (min-width: 960px)': { fontSize: '1.25rem' }
            }}>
              {t('viewer.loadingVideo') || 'Loading Video...'}
            </Typography>
          </Box>
        )}
        
        {/* General Loading Overlay */}
        {isLoading && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: '16px', '@media (min-width: 600px)': { padding: '18px' }, '@media (min-width: 960px)': { padding: '20px' },
            borderRadius: '8px', '@media (min-width: 600px)': { borderRadius: '9px' }, '@media (min-width: 960px)': { borderRadius: '10px' },
            width: '90vw', '@media (min-width: 600px)': { width: '85vw' }, '@media (min-width: 960px)': { width: 'auto' },
            maxWidth: '350px', '@media (min-width: 600px)': { maxWidth: '400px' }, '@media (min-width: 960px)': { maxWidth: 'none' }
          }}>
            <Box sx={{ animation: 'spin 1s linear infinite', mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 } }}>
              <CheckCircle sx={{ 
                fontSize: 32, '@media (min-width: 600px)': { fontSize: 36 }, '@media (min-width: 960px)': { fontSize: 40 }, 
                color: '#4CAF50' 
              }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ 
              color: 'white',
              fontSize: '1rem', '@media (min-width: 600px)': { fontSize: '1.125rem' }, '@media (min-width: 960px)': { fontSize: '1.25rem' }
            }}>
              {t('viewer.processing') || 'Processing...'}
            </Typography>
            <Typography variant="body2" component="div" sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.75rem', '@media (min-width: 600px)': { fontSize: '0.8125rem' }, '@media (min-width: 960px)': { fontSize: '0.875rem' }
            }}>
              {t('viewer.pleaseWait') || 'Please wait while we prepare your video'}
            </Typography>
          </Box>
        )}
        
        {/* Video Overlay */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isLoading ? 
            'linear-gradient(180deg, rgba(76, 175, 80, 0.2) 0%, transparent 20%, transparent 80%, rgba(76, 175, 80, 0.2) 100%)' :
            'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.3) 100%)',
          pointerEvents: 'none',
          transition: 'background 0.3s ease'
        }} />

        {/* Progress Bar - Back to Original Position */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.3)'
        }}>
          <LinearProgress
            variant={isLoading ? "indeterminate" : "determinate"}
            value={isLoading ? undefined : progress}
            sx={{
              height: '100%',
              backgroundColor: 'transparent',
              '& .MuiLinearProgress-bar': {
                backgroundColor: isLoading ? '#4CAF50' : (currentVideo?.is_watched ? '#2196F3' : (rewardEarned ? '#4CAF50' : '#1a237e'))
              }
            }}
          />
          {canSkip && (
            <Box sx={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              boxShadow: '0 0 8px rgba(76,175,80,0.8)'
            }} />
          )}
        </Box>

        {/* Video Info Overlay */}
        <Box sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          color: 'white',
          zIndex: 10
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ fontSize: 16 }} />
                </Box>
                {t('viewer.loading') || 'Loading...'}
              </Box>
            ) : (
              currentVideo.title || currentVideo.id
            )}
          </Typography>
          
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, background: 'rgba(0,0,0,0.35)', borderRadius: '10px', padding: '6px 10px' }}>
            <Business sx={{ fontSize: 16 }} />
            <Box>
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ animation: 'spin 1s linear infinite' }}>
                    <CheckCircle sx={{ fontSize: 12 }} />
                  </Box>
                  <Typography variant="body2" component="span">
                    {t('viewer.loading') || 'Loading...'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" component="span">
                  {currentVideo.section || t('viewer.businessSection')}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={currentVideo?.is_watched ? (t('viewer.alreadyRewardedTooltip') || 'Already rewarded - rewatching will not earn credits') : ''} disableHoverListener={!currentVideo?.is_watched}>
              <Chip
                icon={isLoading ? <Box sx={{ animation: prefersReducedMotion ? 'none' : 'spin 1s linear infinite' }}><CheckCircle /></Box> : (currentVideo?.is_watched ? <InfoOutlined /> : <AttachMoney />)}
                label={isLoading ? (t('viewer.loading') || 'Loading...') : `${t('currency.kwd')} ${videoReward}`}
                sx={{
                  backgroundColor: isLoading ? 'rgba(128, 128, 128, 0.9)' : (currentVideo?.is_watched ? 'rgba(96, 125, 139, 0.9)' : (rewardEarned ? 'rgba(76, 175, 80, 0.9)' : 'rgba(26, 35, 126, 0.9)')),
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Tooltip>
            
            <Typography variant="body2" component="div" sx={{ opacity: 0.8 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ fontSize: 12 }} />
                </Box>
                {t('viewer.loading') || 'Loading...'}
              </Box>
            ) : (
              formatDuration(currentVideo.package?.duration || currentVideo.duration || 10)
            )}
            </Typography>
            
          {/* Watched Status Indicator */}
          {!isLoading && currentVideo?.is_watched && (
            <Tooltip title={t('viewer.alreadyRewardedTooltip') || 'You have already been rewarded for this ad'}>
              <Chip
                icon={<CheckCircle />}
                label={t('viewer.alreadyWatched') || 'WATCHED · no reward'}
                sx={{
                  backgroundColor: 'rgba(33, 150, 243, 0.9)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Tooltip>
          )}
            
            {/* Loading Status Indicator */}
            {isLoading && (
              <Chip
                icon={<Box sx={{ animation: 'spin 1s linear infinite' }}><CheckCircle /></Box>}
                label={t('viewer.loading') || 'Loading...'}
                sx={{
                  backgroundColor: 'rgba(128, 128, 128, 0.9)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
        </Box>

        {/* Control Buttons */}
        <Box sx={{
          position: 'absolute',
          right: 20,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 10
        }}>
          <IconButton
            onClick={toggleMute}
            disabled={isLoading}
            aria-label={isMuted ? (t('viewer.unmute') || 'Unmute video') : (t('viewer.mute') || 'Mute video')}
            sx={{
              backgroundColor: isLoading ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { backgroundColor: isLoading ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)' },
              '&:disabled': {
                backgroundColor: 'rgba(0,0,0,0.3)',
                cursor: 'not-allowed'
              }
            }}
          >
            {isLoading ? (
              <Box sx={{ animation: 'spin 1s linear infinite' }}>
                <CheckCircle />
              </Box>
            ) : (
              isMuted ? <VolumeOff /> : <VolumeUp />
            )}
          </IconButton>

          <IconButton
            onClick={() => navigate(`/viewer/ad/${currentVideo.id}`)}
            disabled={isLoading}
            aria-label={t('viewer.fullscreen') || 'Open video in fullscreen'}
            sx={{
              backgroundColor: isLoading ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { backgroundColor: isLoading ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)' },
              '&:disabled': {
                backgroundColor: 'rgba(0,0,0,0.3)',
                cursor: 'not-allowed'
              }
            }}
          >
            {isLoading ? (
              <Box sx={{ animation: 'spin 1s linear infinite' }}>
                <CheckCircle />
              </Box>
            ) : (
              <Fullscreen />
            )}
          </IconButton>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
          zIndex: 10
        }}>
          {/* Loading Overlay for Navigation */}
          {isLoading && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              zIndex: 15
            }}>
              {t('viewer.loading') || 'Loading...'}
            </Box>
          )}
          {currentVideoIndex > 0 && (
            <IconButton
              onClick={handlePreviousVideo}
              disabled={isLoading}
              aria-label={t('viewer.previousVideo') || 'Go to previous video'}
              sx={{
                backgroundColor: isLoading ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { backgroundColor: isLoading ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)' },
                '&:disabled': {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  cursor: 'not-allowed'
                }
              }}
            >
              {isLoading ? (
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ transform: 'rotate(180deg)', fontSize: 20 }} />
                </Box>
              ) : (
                <SkipNext sx={{ transform: 'rotate(180deg)' }} />
              )}
            </IconButton>
          )}

          {canSkip && currentVideoIndex < videos.length - 1 && (
            <IconButton
              onClick={handleNextVideo}
              disabled={isLoading}
              aria-label={t('viewer.nextVideo') || 'Go to next video'}
              sx={{
                backgroundColor: isLoading ? 'rgba(128, 128, 128, 0.9)' : 'rgba(76, 175, 80, 0.9)',
                color: 'white',
                width: 80,
                height: 80,
                '&:hover': { backgroundColor: isLoading ? 'rgba(128, 128, 128, 0.9)' : 'rgba(76, 175, 80, 1)' },
                '&:disabled': {
                  backgroundColor: 'rgba(128, 128, 128, 0.9)',
                  cursor: 'not-allowed'
                }
              }}
            >
              {isLoading ? (
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ fontSize: 40 }} />
                </Box>
              ) : (
                <SkipNext sx={{ fontSize: 40 }} />
              )}
            </IconButton>
          )}
        </Box>

        {/* Prominent Next Button After Completion */}
        {canSkip && (
          <Box sx={{
            position: 'absolute',
            bottom: '5vh', '@media (min-width: 600px)': { bottom: '8vh' }, '@media (min-width: 960px)': { bottom: '100px' },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 15,
            width: '90vw', '@media (min-width: 600px)': { width: '80vw' }, '@media (min-width: 960px)': { width: 'auto' },
            maxWidth: '400px', '@media (min-width: 600px)': { maxWidth: '350px' }, '@media (min-width: 960px)': { maxWidth: 'none' }
          }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                if (process.env.NODE_ENV === 'development') {
                  devLog('🎯 NEXT button clicked!');
                  devLog('🔍 Button state - canSkip:', canSkip, 'rewardEarned:', rewardEarned, 'currentVideoIndex:', currentVideoIndex);
                }
                handleNextVideo();
              }}
              startIcon={isLoading ? (
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle />
                </Box>
              ) : (
                <SkipNext />
              )}
              disabled={isLoading}
              aria-label={t('viewer.nextVideo') || 'Continue to next video'}
              fullWidth={{ xs: true, sm: true, md: false }}
              sx={{
                backgroundColor: isLoading ? 'rgba(128, 128, 128, 0.95)' : 'rgba(76, 175, 80, 0.95)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem', '@media (min-width: 600px)': { fontSize: '1.05rem' }, '@media (min-width: 960px)': { fontSize: '1.1rem' },
                px: 3, '@media (min-width: 600px)': { px: 3.5 }, '@media (min-width: 960px)': { px: 4 },
                py: 1.5, '@media (min-width: 600px)': { py: 1.75 }, '@media (min-width: 960px)': { py: 2 },
                borderRadius: 2.5, '@media (min-width: 600px)': { borderRadius: 2.75 }, '@media (min-width: 960px)': { borderRadius: 3 },
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: isLoading ? 'none' : '0 8px 32px rgba(76, 175, 80, 0.4)',
                minHeight: '48px', '@media (min-width: 600px)': { minHeight: '52px' }, '@media (min-width: 960px)': { minHeight: '56px' },
                '&:hover': {
                  backgroundColor: isLoading ? 'rgba(128, 128, 128, 0.95)' : 'rgba(76, 175, 80, 1)',
                  transform: isLoading ? 'none' : 'translateY(-2px)',
                  boxShadow: isLoading ? 'none' : '0 12px 40px rgba(76, 175, 80, 0.6)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(128, 128, 128, 0.95)',
                  cursor: 'not-allowed'
                }
              }}
            >
              {isLoading ? (t('viewer.loading') || 'Loading...') : (currentVideoIndex < videos.length - 1 ? (t('viewer.nextVideo') || 'NEXT') : (t('viewer.complete') || 'COMPLETE'))}
            </Button>
          </Box>
        )}
        
        {/* Debug Info - Only in Development */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{
            position: 'absolute',
            top: '5vh',
            left: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px',
            borderRadius: '3px',
            fontSize: '10px',
            zIndex: 20,
            maxWidth: '85vw',
            '@media (min-width: 600px)': {
              top: '8vh',
              left: '15px',
              padding: '7px',
              borderRadius: '3.5px',
              fontSize: '11px',
              maxWidth: '80vw'
            },
            '@media (min-width: 960px)': {
              top: '100px',
              left: '20px',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              maxWidth: 'auto'
            }
          }}>
            <div>canSkip: {canSkip ? 'true' : 'false'}</div>
            <div>rewardEarned: {rewardEarned ? 'true' : 'false'}</div>
            <div>currentVideoIndex: {currentVideoIndex}</div>
            <div>videos.length: {videos.length}</div>
            <div>processedVideos: {Array.from(processedVideos).join(', ')}</div>
            <div>showCompletionMessage: {showCompletionMessage ? 'true' : 'false'}</div>
          </Box>
        )}

        {/* Play/Pause Button */}
        {!isPlaying && (
          <Box sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}>
            <IconButton
              onClick={togglePlayPause}
              disabled={isLoading}
              aria-label={t('viewer.playVideo') || 'Play video'}
              sx={{
                backgroundColor: isLoading ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.7)',
                color: 'white',
                width: 80,
                height: 80,
                '&:hover': { backgroundColor: isLoading ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.9)' },
                '&:disabled': {
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  cursor: 'not-allowed'
                }
              }}
            >
              {isLoading ? (
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ fontSize: 40 }} />
                </Box>
              ) : (
                <PlayArrow sx={{ fontSize: 40 }} />
              )}
            </IconButton>
          </Box>
        )}

        {/* Loading Overlay for Reward Processing */}
        {isProcessingReward && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 25,
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: '16px',
            borderRadius: '8px',
            width: '90vw',
            maxWidth: '350px',
            '@media (min-width: 600px)': {
              padding: '18px',
              borderRadius: '9px',
              width: '85vw',
              maxWidth: '400px'
            },
            '@media (min-width: 960px)': {
              padding: '20px',
              borderRadius: '10px',
              width: 'auto',
              maxWidth: 'none'
            }
          }}>
            <Box sx={{ animation: 'spin 1s linear infinite', mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 } }}>
              <CheckCircle sx={{ 
                fontSize: 32, '@media (min-width: 600px)': { fontSize: 36 }, '@media (min-width: 960px)': { fontSize: 40 }, 
                color: '#4CAF50' 
              }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ 
              color: 'white',
              fontSize: '1rem', '@media (min-width: 600px)': { fontSize: '1.125rem' }, '@media (min-width: 960px)': { fontSize: '1.25rem' }
            }}>
              {t('viewer.processingReward') || 'Processing Reward...'}
            </Typography>
            <Typography variant="body2" component="div" sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.75rem', '@media (min-width: 600px)': { fontSize: '0.8125rem' }, '@media (min-width: 960px)': { fontSize: '0.875rem' }
            }}>
              {t('viewer.pleaseWait') || 'Please wait while we process your reward'}
            </Typography>
          </Box>
        )}

        {/* Reward Completion Indicator */}
        {rewardEarned && !isProcessingReward && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            textAlign: 'center',
            color: 'white',
            width: '95vw', '@media (min-width: 600px)': { width: '90vw' }, '@media (min-width: 960px)': { width: 'auto' },
            maxWidth: '400px', '@media (min-width: 600px)': { maxWidth: '450px' }, '@media (min-width: 960px)': { maxWidth: 'none' }
          }}>
            <CheckCircle sx={{ 
              fontSize: 60, '@media (min-width: 600px)': { fontSize: 70 }, '@media (min-width: 960px)': { fontSize: 80 }, 
              color: '#4CAF50', 
              mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 } 
            }} />
            <Typography variant="h5" component="div" sx={{ 
              fontWeight: 700, 
              mb: 1, '@media (min-width: 600px)': { mb: 1.25 }, '@media (min-width: 960px)': { mb: 1 },
              fontSize: '1.25rem', '@media (min-width: 600px)': { fontSize: '1.5rem' }, '@media (min-width: 960px)': { fontSize: '1.5rem' }
            }}>
              {t('viewer.videoCompleted')}
            </Typography>
            <Typography variant="h6" component="div" sx={{ 
              color: '#4CAF50', 
              mb: 1, '@media (min-width: 600px)': { mb: 1.25 }, '@media (min-width: 960px)': { mb: 1 },
              fontSize: '1.125rem', '@media (min-width: 600px)': { fontSize: '1.25rem' }, '@media (min-width: 960px)': { fontSize: '1.25rem' }
            }}>
              +{t('currency.kwd')} {rewardAmount.toFixed(6)}
            </Typography>
            <Typography variant="body1" component="div" sx={{ 
              color: '#4CAF50', 
              opacity: 0.9,
              fontSize: '0.875rem', '@media (min-width: 600px)': { fontSize: '0.9375rem' }, '@media (min-width: 960px)': { fontSize: '1rem' }
            }}>
              (+{(rewardAmount * 1000).toFixed(0)} {t('currency.fils')})
            </Typography>
            
            {/* ✅ ADDED: Next button instruction */}
            <Box sx={{ 
              mt: 2, '@media (min-width: 600px)': { mt: 2.5 }, '@media (min-width: 960px)': { mt: 3 }, 
              p: 1.5, '@media (min-width: 600px)': { p: 1.75 }, '@media (min-width: 960px)': { p: 2 }, 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              borderRadius: 1.5, '@media (min-width: 600px)': { borderRadius: 1.75 }, '@media (min-width: 960px)': { borderRadius: 2 } 
            }}>
              <Typography variant="body1" component="div" sx={{ 
                color: 'white', 
                mb: 0.75, '@media (min-width: 600px)': { mb: 1 }, '@media (min-width: 960px)': { mb: 1 },
                fontSize: '0.875rem', '@media (min-width: 600px)': { fontSize: '1rem' }, '@media (min-width: 960px)': { fontSize: '1rem' }
              }}>
                🎯 {t('viewer.rewardEarned') || 'Reward Earned!'}
              </Typography>
              <Typography variant="body2" component="div" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.75rem', '@media (min-width: 600px)': { fontSize: '0.8125rem' }, '@media (min-width: 960px)': { fontSize: '0.875rem' }
              }}>
                {t('viewer.clickNextToContinue') || 'Click NEXT to continue to next video'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Completion Message for Last Video */}
        {showCompletionMessage && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.9)',
            padding: '20px', '@media (min-width: 600px)': { padding: '25px' }, '@media (min-width: 960px)': { padding: '30px' },
            borderRadius: '12px', '@media (min-width: 600px)': { borderRadius: '14px' }, '@media (min-width: 960px)': { borderRadius: '15px' },
            width: '95vw', '@media (min-width: 600px)': { width: '90vw' }, '@media (min-width: 960px)': { width: '400px' },
            maxWidth: '400px', '@media (min-width: 600px)': { maxWidth: '450px' }, '@media (min-width: 960px)': { maxWidth: '500px' }
          }}>
            <CheckCircle sx={{ 
              fontSize: 60, '@media (min-width: 600px)': { fontSize: 70 }, '@media (min-width: 960px)': { fontSize: 80 }, 
              color: '#4CAF50', 
              mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 } 
            }} />
            <Typography variant="h4" component="div" sx={{ 
              fontWeight: 700, 
              mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 }, 
              color: '#4CAF50',
              fontSize: '1.5rem', '@media (min-width: 600px)': { fontSize: '1.75rem' }, '@media (min-width: 960px)': { fontSize: '2.125rem' }
            }}>
              🎉 {t('viewer.allVideosCompleted') || 'All Videos Completed!'}
            </Typography>
            <Typography variant="h6" component="div" sx={{ 
              color: 'white', 
              mb: 1.5, '@media (min-width: 600px)': { mb: 1.75 }, '@media (min-width: 960px)': { mb: 2 },
              fontSize: '1rem', '@media (min-width: 600px)': { fontSize: '1.125rem' }, '@media (min-width: 960px)': { fontSize: '1.25rem' }
            }}>
              {t('viewer.congratulations') || 'Congratulations! You have completed all available videos in this section.'}
            </Typography>
            <Typography variant="body1" component="div" sx={{ 
              color: 'rgba(255,255,255,0.8)', 
              mb: 2, '@media (min-width: 600px)': { mb: 2.5 }, '@media (min-width: 960px)': { mb: 3 },
              fontSize: '0.875rem', '@media (min-width: 600px)': { fontSize: '0.9375rem' }, '@media (min-width: 960px)': { fontSize: '1rem' }
            }}>
              {t('viewer.rewardsCollected') || 'All rewards have been collected and added to your wallet.'}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                setShowCompletionMessage(false);
                // Could redirect to main page or refresh
                window.location.reload();
              }}
              fullWidth={{ xs: true, sm: true, md: false }}
              sx={{
                backgroundColor: '#4CAF50',
                color: 'white',
                fontWeight: 700,
                px: 3, '@media (min-width: 600px)': { px: 3.5 }, '@media (min-width: 960px)': { px: 4 },
                py: 1.5, '@media (min-width: 600px)': { py: 1.75 }, '@media (min-width: 960px)': { py: 2 },
                borderRadius: 2.5, '@media (min-width: 600px)': { borderRadius: 2.75 }, '@media (min-width: 960px)': { borderRadius: 3 },
                textTransform: 'uppercase',
                fontSize: '0.875rem', '@media (min-width: 600px)': { fontSize: '1rem' }, '@media (min-width: 960px)': { fontSize: '1.1rem' },
                minHeight: '44px', '@media (min-width: 600px)': { minHeight: '48px' }, '@media (min-width: 960px)': { minHeight: '52px' },
                '&:hover': {
                  backgroundColor: '#45a049',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {t('viewer.backToMain') || 'Back to Main'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Video Queue Preview - Blocked until NEXT button is clicked */}
      <Box sx={{
        position: 'absolute',
        right: '10px', '@media (min-width: 600px)': { right: '15px' }, '@media (min-width: 960px)': { right: '20px' },
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5, '@media (min-width: 600px)': { gap: 0.75 }, '@media (min-width: 960px)': { gap: 1 },
        zIndex: 10
      }}>
        {videos.slice(currentVideoIndex + 1, currentVideoIndex + 4).map((video, index) => (
          <Box
            key={video.id}
            sx={{
              width: 50, '@media (min-width: 600px)': { width: 55 }, '@media (min-width: 960px)': { width: 60 },
              height: 65, '@media (min-width: 600px)': { height: 72 }, '@media (min-width: 960px)': { height: 80 },
              borderRadius: 1.5, '@media (min-width: 600px)': { borderRadius: 1.75 }, '@media (min-width: 960px)': { borderRadius: 2 },
              overflow: 'hidden',
              border: canSkip ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.1)',
              cursor: canSkip ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              opacity: canSkip ? 1 : 0.3,
              filter: canSkip ? 'none' : 'grayscale(100%)',
              '&:hover': canSkip ? {
                borderColor: 'rgba(255,255,255,0.8)',
                transform: 'scale(1.05)'
              } : {}
            }}
            onClick={() => {
              // ✅ BLOCKED: Users cannot navigate to next video until NEXT button is clicked
              if (canSkip) {
                devLog('🔄 User clicked on next video preview - allowed because canSkip is true');
                // Use the proper handleNextVideo function instead of direct index manipulation
                handleNextVideo();
              } else {
                devLog('🚫 User clicked on next video preview - blocked because canSkip is false');
              }
            }}
          >
            <Box sx={{
              width: '100%',
              height: '100%',
              backgroundColor: isLoading ? 'rgba(76, 175, 80, 0.8)' : (canSkip ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {isLoading ? (
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ 
                    color: 'white', 
                    fontSize: 16, '@media (min-width: 600px)': { fontSize: 18 }, '@media (min-width: 960px)': { fontSize: 20 } 
                  }} />
                </Box>
              ) : (
                <PlayArrow sx={{ 
                  color: canSkip ? 'white' : 'rgba(255,255,255,0.3)', 
                  fontSize: 16, '@media (min-width: 600px)': { fontSize: 18 }, '@media (min-width: 960px)': { fontSize: 20 } 
                }} />
              )}
              
              {/* Watched indicator for queued items */}
              {video?.is_watched && (
                <Box sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  backgroundColor: 'rgba(33,150,243,0.9)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Visibility sx={{ fontSize: 12 }} />
                </Box>
              )}

              {/* Blocked indicator */}
              {!canSkip && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.5rem', '@media (min-width: 600px)': { fontSize: '0.55rem' }, '@media (min-width: 960px)': { fontSize: '0.6rem' },
                  padding: '1px 3px', '@media (min-width: 600px)': { padding: '1.5px 3.5px' }, '@media (min-width: 960px)': { padding: '2px 4px' },
                  borderRadius: '3px', '@media (min-width: 600px)': { borderRadius: '3.5px' }, '@media (min-width: 960px)': { borderRadius: '4px' },
                  whiteSpace: 'nowrap',
                  zIndex: 1
                }}>
                  {t('viewer.nextRequired') || 'NEXT REQUIRED'}
                </Box>
              )}
              
              {/* Lock glyph when blocked */}
              {!canSkip && (
                <Box sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock sx={{ fontSize: 12 }} />
                </Box>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  fontSize: '0.5rem', '@media (min-width: 600px)': { fontSize: '0.55rem' }, '@media (min-width: 960px)': { fontSize: '0.6rem' },
                  padding: '1px 3px', '@media (min-width: 600px)': { padding: '1.5px 3.5px' }, '@media (min-width: 960px)': { padding: '2px 4px' },
                  borderRadius: '3px', '@media (min-width: 600px)': { borderRadius: '3.5px' }, '@media (min-width: 960px)': { borderRadius: '4px' },
                  whiteSpace: 'nowrap',
                  zIndex: 1
                }}>
                  {t('viewer.loading') || 'LOADING...'}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>

              {/* Video Counter */}
        <Box sx={{
          position: 'absolute',
          top: '5vh', '@media (min-width: 600px)': { top: '8vh' }, '@media (min-width: 960px)': { top: '20px' },
          right: '10px', '@media (min-width: 600px)': { right: '15px' }, '@media (min-width: 960px)': { right: '20px' },
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '6px 12px', '@media (min-width: 600px)': { padding: '7px 14px' }, '@media (min-width: 960px)': { padding: '8px 16px' },
          borderRadius: 16, '@media (min-width: 600px)': { borderRadius: 18 }, '@media (min-width: 960px)': { borderRadius: 20 },
          zIndex: 10
        }}>
          <Typography variant="body2" component="div" sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem', '@media (min-width: 600px)': { fontSize: '0.8125rem' }, '@media (min-width: 960px)': { fontSize: '0.875rem' }
          }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ fontSize: 12, '@media (min-width: 600px)': { fontSize: 13 }, '@media (min-width: 960px)': { fontSize: 14 } }} />
                </Box>
                {t('viewer.loading') || 'Loading...'}
              </Box>
            ) : (
              `${currentVideoIndex + 1} / ${videos.length}`
            )}
          </Typography>
        </Box>

        {/* Floating Animated Credit Bar */}
        <Box sx={{
          position: 'absolute',
          top: '5vh', '@media (min-width: 600px)': { top: '8vh' }, '@media (min-width: 960px)': { top: '20px' },
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px', '@media (min-width: 600px)': { borderRadius: '22px' }, '@media (min-width: 960px)': { borderRadius: '25px' },
          padding: '10px 20px', '@media (min-width: 600px)': { padding: '11px 22px' }, '@media (min-width: 960px)': { padding: '12px 24px' },
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 20,
          animation: 'creditBarFloat 3s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5, '@media (min-width: 600px)': { gap: 1.75 }, '@media (min-width: 960px)': { gap: 2 }
        }}>
          <AttachMoney sx={{ 
            color: '#4CAF50', 
            fontSize: 18, '@media (min-width: 600px)': { fontSize: 19 }, '@media (min-width: 960px)': { fontSize: 20 },
            animation: 'creditIconGlow 2s ease-in-out infinite alternate'
          }} />
          <Typography variant="body1" component="div" sx={{ 
            color: 'white', 
            fontWeight: 600,
            fontSize: '1rem', '@media (min-width: 600px)': { fontSize: '1.05rem' }, '@media (min-width: 960px)': { fontSize: '1.1rem' }
          }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ animation: 'spin 1s linear infinite' }}>
                  <CheckCircle sx={{ fontSize: 14, '@media (min-width: 600px)': { fontSize: 15 }, '@media (min-width: 960px)': { fontSize: 16 } }} />
                </Box>
                {t('viewer.loading') || 'Loading...'}
              </Box>
            ) : (
              `+${t('currency.kwd')} ${videoReward}`
            )}
          </Typography>
          {!isLoading && (
            <Box sx={{
              width: '6px', '@media (min-width: 600px)': { width: '7px' }, '@media (min-width: 960px)': { width: '8px' },
              height: '6px', '@media (min-width: 600px)': { height: '7px' }, '@media (min-width: 960px)': { height: '8px' },
              backgroundColor: '#4CAF50',
              borderRadius: '50%',
              animation: 'creditDotPulse 1.5s ease-in-out infinite'
            }} />
          )}
        </Box>

      {/* CTA Button - Instagram-style with Animation */}
      {currentVideo?.cta_data?.enabled && currentVideo?.cta_data?.link && (
        <Box sx={{
          position: 'absolute',
          bottom: '20vh', '@media (min-width: 600px)': { bottom: '18vh' }, '@media (min-width: 960px)': { bottom: '160px' },
          right: '10px', '@media (min-width: 600px)': { right: '15px' }, '@media (min-width: 960px)': { right: '20px' },
          zIndex: 15
        }}>
          <Tooltip title={!canSkip ? (t('viewer.waitForCompletion') || 'Completes after watching') : ''} disableHoverListener={canSkip}>
            <span>
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  if (canSkip && !isLoading) {
                    window.open(currentVideo.cta_data.link, '_blank');
                  }
                }}
                disabled={!canSkip || isLoading}
                startIcon={isLoading ? (
                  <Box sx={{ animation: prefersReducedMotion ? 'none' : 'spin 1s linear infinite' }}>
                    <CheckCircle />
                  </Box>
                ) : (
                  <OpenInNew />
                )}
                sx={{
                  background: canSkip && !isLoading ? 'linear-gradient(135deg, #FF4081, #F50057)' : (isLoading ? 'rgba(76, 175, 80, 0.95)' : 'rgba(128, 128, 128, 0.6)'),
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.8rem', '@media (min-width: 600px)': { fontSize: '0.85rem' }, '@media (min-width: 960px)': { fontSize: '0.9rem' },
                  px: 2.5, '@media (min-width: 600px)': { px: 2.75 }, '@media (min-width: 960px)': { px: 3 },
                  py: 1.25, '@media (min-width: 600px)': { py: 1.375 }, '@media (min-width: 960px)': { py: 1.5 },
                  borderRadius: 2.5, '@media (min-width: 600px)': { borderRadius: 2.75 }, '@media (min-width: 960px)': { borderRadius: 3 },
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: canSkip && !isLoading ? '0 8px 32px rgba(255, 64, 129, 0.4)' : (isLoading ? '0 8px 32px rgba(76, 175, 80, 0.4)' : 'none'),
                  transition: 'all 0.3s ease',
                  animation: prefersReducedMotion ? 'none' : (canSkip ? 'ctaButtonPulse 2s ease-in-out infinite' : 'none'),
                  minHeight: '40px', '@media (min-width: 600px)': { minHeight: '44px' }, '@media (min-width: 960px)': { minHeight: '48px' },
                  '&:hover': canSkip && !isLoading ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(255, 64, 129, 0.6)'
                  } : {},
                  '&:disabled': {
                    backgroundColor: 'rgba(128, 128, 128, 0.6)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'not-allowed'
                  }
                }}
              >
                {currentVideo.cta_data.text || t('viewer.learnMore')}
              </Button>
            </span>
          </Tooltip>
          
          {/* CTA Status Indicator */}
          {!canSkip && (
            <Box sx={{
              position: 'absolute',
              top: -20,
            '@media (min-width: 600px)': { top: -22 },
            '@media (min-width: 960px)': { top: -25 },
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.6rem', '@media (min-width: 600px)': { fontSize: '0.65rem' }, '@media (min-width: 960px)': { fontSize: '0.7rem' },
              padding: '3px 6px', '@media (min-width: 600px)': { padding: '3.5px 7px' }, '@media (min-width: 960px)': { padding: '4px 8px' },
              borderRadius: '10px', '@media (min-width: 600px)': { borderRadius: '11px' }, '@media (min-width: 960px)': { borderRadius: '12px' },
              whiteSpace: 'nowrap',
              zIndex: 16
            }}>
              {t('viewer.waitForCompletion') || 'Wait for completion'}
            </Box>
          )}
          
          {/* CTA Loading Indicator */}
          {!canSkip && isProcessingReward && (
            <Box sx={{
              position: 'absolute',
              top: -35,
            '@media (min-width: 600px)': { top: -40 },
            '@media (min-width: 960px)': { top: -45 },
              right: 0,
              backgroundColor: 'rgba(76, 175, 80, 0.9)',
              color: 'white',
              fontSize: '0.6rem', '@media (min-width: 600px)': { fontSize: '0.65rem' }, '@media (min-width: 960px)': { fontSize: '0.7rem' },
              padding: '3px 6px', '@media (min-width: 600px)': { padding: '3.5px 7px' }, '@media (min-width: 960px)': { padding: '4px 8px' },
              borderRadius: '10px', '@media (min-width: 600px)': { borderRadius: '11px' }, '@media (min-width: 960px)': { borderRadius: '12px' },
              whiteSpace: 'nowrap',
              zIndex: 16
            }}>
              {t('viewer.processingReward') || 'Processing...'}
            </Box>
          )}
        </Box>
      )}

      {/* Comment Button */}
      <Box sx={{
        position: 'absolute',
        bottom: '15vh', '@media (min-width: 600px)': { bottom: '13vh' }, '@media (min-width: 960px)': { bottom: '120px' },
        right: '10px', '@media (min-width: 600px)': { right: '15px' }, '@media (min-width: 960px)': { right: '20px' },
        zIndex: 15
      }}>
        <IconButton
          onClick={() => setShowComments(true)}
          aria-label={t('viewer.openComments') || 'Open comments'}
          aria-describedby="comment-count"
          disabled={isLoading}
          sx={{
            backgroundColor: isLoading ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.7)',
            color: 'white',
            width: 48, '@media (min-width: 600px)': { width: 52 }, '@media (min-width: 960px)': { width: 56 },
            height: 48, '@media (min-width: 600px)': { height: 52 }, '@media (min-width: 960px)': { height: 56 },
            '&:hover': { backgroundColor: isLoading ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.9)' },
            '&:disabled': {
              backgroundColor: 'rgba(0,0,0,0.4)',
              cursor: 'not-allowed'
            }
          }}
        >
          {isLoading ? (
            <Box sx={{ animation: 'spin 1s linear infinite' }}>
              <ChatBubbleOutline />
            </Box>
          ) : (
            <ChatBubbleOutline />
          )}
        </IconButton>
        
        {/* Comment Count Badge */}
        {commentCount > 0 && (
          <Box 
            id="comment-count"
            sx={{
              position: 'absolute',
                          top: -6,
            right: -6,
            '@media (min-width: 600px)': { top: -7, right: -7 },
            '@media (min-width: 960px)': { top: -8, right: -8 },
              backgroundColor: 'error.main',
              color: 'white',
              borderRadius: '50%',
              width: 20, '@media (min-width: 600px)': { width: 22 }, '@media (min-width: 960px)': { width: 24 },
              height: 20, '@media (min-width: 600px)': { height: 22 }, '@media (min-width: 960px)': { height: 24 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem', '@media (min-width: 600px)': { fontSize: '0.6875rem' }, '@media (min-width: 960px)': { fontSize: '0.75rem' },
              fontWeight: 'bold',
              boxShadow: '0 0 10px rgba(244,67,54,0.7)'
            }}
          >
            {commentCount > 99 ? '99+' : commentCount}
          </Box>
        )}
        
        {/* Loading Badge for Comment Count */}
        {isLoading && commentCount === 0 && (
          <Box sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            '@media (min-width: 600px)': { top: -7, right: -7 },
            '@media (min-width: 960px)': { top: -8, right: -8 },
            backgroundColor: 'rgba(255,255,255,0.5)',
            color: 'white',
            borderRadius: '50%',
            width: 20, '@media (min-width: 600px)': { width: 22 }, '@media (min-width: 960px)': { width: 24 },
            height: 20, '@media (min-width: 600px)': { height: 22 }, '@media (min-width: 960px)': { height: 24 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem', '@media (min-width: 600px)': { fontSize: '0.6875rem' }, '@media (min-width: 960px)': { fontSize: '0.75rem' },
            fontWeight: 'bold'
          }}>
            <Box sx={{ animation: 'spin 1s linear infinite' }}>
              <ChatBubbleOutline sx={{ fontSize: 10, '@media (min-width: 600px)': { fontSize: 11 }, '@media (min-width: 960px)': { fontSize: 12 } }} />
            </Box>
          </Box>
        )}
        
        {/* Fallback Badge for when comment count is unavailable */}
        {!isLoading && commentCount === 0 && (
          <Box sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: 'rgba(255,255,255,0.3)',
            color: 'white',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            ?
          </Box>
        )}
      </Box>

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
          icon={<CheckCircle />}
          sx={{ width: '100%' }}
        >
          {t('viewer.rewardEarned', { amount: rewardAmount })}
        </Alert>
      </Snackbar>

      {/* Comment Section */}
      <CommentSection
        adId={currentVideo?.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentCountChange={(newCount) => {
          setCommentCount(newCount);
          // Also refresh comment count from server to ensure accuracy
          if (currentVideo?.id) {
            fetchCommentCount(currentVideo.id);
          }
        }}
              />
      </Box>
    </VideoPlayerErrorBoundary>
  );
}
