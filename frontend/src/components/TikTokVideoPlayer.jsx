import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Snackbar,
  Alert
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  DollarSign,
  Building2,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  Info,
  Eye,
  Lock,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';
import { cn } from '../lib/utils';

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
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-black p-5 text-white">
          <p className="mb-2 text-xl font-bold text-red-400">
            {this.props.t?.('viewer.errorOccurred') || 'Something went wrong'}
          </p>
          <p className="mb-4 text-center text-sm text-white/70">
            {this.props.t?.('viewer.videoPlayerError') || 'The video player encountered an error. Please refresh the page to try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {this.props.t?.('common.refresh') || 'Refresh Page'}
          </button>
        </div>
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
    
    @keyframes fadeInBounce {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
      }
      50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.1);
      }
      70% {
        transform: translate(-50%, -50%) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
    
    @keyframes pulseGlow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.6), 0 0 40px rgba(76, 175, 80, 0.4);
      }
      50% {
        box-shadow: 0 0 30px rgba(76, 175, 80, 0.8), 0 0 60px rgba(76, 175, 80, 0.6);
      }
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
  const [nextButtonPosition, setNextButtonPosition] = useState({ top: '75%', left: '50%' }); // ✅ NEW: Random button position
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [processedVideos, setProcessedVideos] = useState(new Set()); // Track processed videos
  
  // ✅ OPTIMIZED: Use only refs for proof tokens (no re-renders needed)
  const currentProofTokenRef = useRef(null);
  const viewStartTimeRef = useRef(null);
  const requiredDurationMsRef = useRef(null);
  
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
    // FIXED: now uses backend response, no local mutation
    const backendReward = currentVideo?.package?.viewer_reward ?? currentVideo?.viewer_reward;
    if (currentVideo?.is_watched) return '0.000';
    if (backendReward == null) return null;
    return Number(backendReward).toFixed(6);
  }, [currentVideo]);
  // FIXED: now uses backend response, no local mutation
  const displayReward = videoReward ?? '—';
  
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
        // FIXED: now uses backend response, no local mutation
        if (response.viewEvent.requiredDuration) {
          requiredDurationMsRef.current = Number(response.viewEvent.requiredDuration) || null;
        }
        
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

  // ✅ NEW: Generate random position for NEXT button
  const generateRandomButtonPosition = useCallback(() => {
    // Define 8 primary zones + random variations for unpredictability
    const zones = [
      // Top row
      { top: 12, left: 15 },   // Top-left
      { top: 12, left: 50 },   // Top-center
      { top: 12, left: 85 },   // Top-right
      
      // Middle row
      { top: 45, left: 15 },   // Middle-left
      { top: 45, left: 85 },   // Middle-right
      
      // Bottom row
      { top: 75, left: 15 },   // Bottom-left
      { top: 75, left: 50 },   // Bottom-center (default)
      { top: 75, left: 85 },   // Bottom-right
    ];
    
    // Pick random zone
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    
    // Add random variation (+/- 5-8%) for unpredictability
    const topVariation = (Math.random() - 0.5) * 10; // -5% to +5%
    const leftVariation = (Math.random() - 0.5) * 12; // -6% to +6%
    
    // Calculate final position with constraints
    let finalTop = randomZone.top + topVariation;
    let finalLeft = randomZone.left + leftVariation;
    
    // Ensure button stays within safe bounds (10% to 85% for top, 10% to 90% for left)
    finalTop = Math.max(10, Math.min(85, finalTop));
    finalLeft = Math.max(10, Math.min(90, finalLeft));
    
    const position = {
      top: `${finalTop}%`,
      left: `${finalLeft}%`,
    };
    
    devLog('🎲 Generated random NEXT button position:', position);
    return position;
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
        
        // ✅ NEW: Generate random position for NEXT button
        const randomPosition = generateRandomButtonPosition();
        setNextButtonPosition(randomPosition);
        devLog('🎲 NEXT button will appear at:', randomPosition);
        
        // Mark video as ready for completion processing
        devLog('🎯 Video marked as ready for NEXT button processing');
        devLog('🔍 State after video ended - rewardEarned:', true, 'canSkip:', true, 'isPlaying:', false);
      } else {
        devLog('🛑 Video already completed, ignoring ended event');
      }
    };

    const handleTimeUpdate = () => {
      if (rewardEarned) return;
      const thresholdMs = requiredDurationMsRef.current || (video.duration * 1000);
      const watchedMs = video.currentTime * 1000;
      if (thresholdMs && watchedMs >= thresholdMs * 0.95) {
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
            const thresholdMs = requiredDurationMsRef.current || (duration * 1000);
            const watchedMs = currentTime * 1000;
            if (thresholdMs && watchedMs >= thresholdMs * 0.95 && !rewardEarned) {
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
      let proofToken = currentProofTokenRef.current;
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
              // Use the new token for completion
              proofToken = newProofToken;
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
      
      // ✅ NEW: Reset button position (will be randomized on next completion)
      setNextButtonPosition({ top: '75%', left: '50%' }); // Default position (won't show until canSkip=true)
      
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg font-semibold text-slate-400">
          {t('common.noVideosAvailable')}
        </p>
      </div>
    );
  }

  return (
    <VideoPlayerErrorBoundary t={t}>
      <style>{creditBarStyles}</style>
      <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main Video Player */}
      <div className="relative flex h-full w-full items-center justify-center">
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
            reward: displayReward
          }) || `${currentVideo.title || 'Video'} with ${formatDuration(currentVideo.package?.duration || currentVideo.duration || 10)} duration and ${displayReward} KWD reward`}
        </div>
        
        {/* Video Loading Overlay */}
        <AnimatePresence>
          {isVideoLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/80 px-6 py-5 text-center backdrop-blur-sm"
            >
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500 md:h-10 md:w-10" />
              <p className="text-sm font-semibold text-white md:text-base">
                {t('viewer.loadingVideo') || 'Loading Video...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* General Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/90 px-6 py-5 text-center backdrop-blur-sm"
            >
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500 md:h-10 md:w-10" />
              <p className="text-sm font-semibold text-white md:text-base">
                {t('viewer.processing') || 'Processing...'}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {t('viewer.pleaseWait') || 'Please wait while we prepare your video'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Video Overlay */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 transition-all duration-300',
            isLoading
              ? 'bg-gradient-to-b from-blue-500/20 via-transparent to-blue-500/20'
              : 'bg-gradient-to-b from-black/30 via-transparent to-black/30'
          )}
        />

        {/* Progress Bar */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-white/20">
          {isLoading ? (
            <div className="h-full w-full animate-pulse bg-blue-500/60" />
          ) : (
            <motion.div
              className={cn(
                'h-full',
                currentVideo?.is_watched ? 'bg-sky-500' : rewardEarned ? 'bg-emerald-500' : 'bg-blue-600'
              )}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          )}
          {canSkip && (
            <div className="absolute -right-1 -top-[3px] h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          )}
        </div>

        {/* Video Info Overlay */}
        <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
          <h3 className="mb-1.5 text-lg font-bold drop-shadow-lg md:text-xl">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('viewer.loading') || 'Loading...'}
              </span>
            ) : (
              currentVideo.title || currentVideo.id
            )}
          </h3>

          <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-black/40 px-3 py-1.5 backdrop-blur-sm">
            <Building2 className="h-4 w-4" />
            <span className="text-xs">
              {isLoading ? (t('viewer.loading') || 'Loading...') : (currentVideo.section || t('viewer.businessSection'))}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reward badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white',
                isLoading ? 'bg-gray-500/90' : currentVideo?.is_watched ? 'bg-slate-500/90' : rewardEarned ? 'bg-emerald-600/90' : 'bg-blue-700/90'
              )}
              title={currentVideo?.is_watched ? (t('viewer.alreadyRewardedTooltip') || 'Already rewarded') : ''}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : currentVideo?.is_watched ? <Info className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
              {isLoading ? (t('viewer.loading') || 'Loading...') : `${t('currency.kwd')} ${displayReward}`}
            </span>

            {/* Duration */}
            <span className="text-xs text-white/70">
              {isLoading ? '...' : formatDuration(currentVideo.package?.duration || currentVideo.duration || 10)}
            </span>

            {/* Watched indicator */}
            {!isLoading && currentVideo?.is_watched && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                <CheckCircle2 className="h-3 w-3" />
                {t('viewer.alreadyWatched') || 'WATCHED'}
              </span>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('viewer.loading') || 'Loading...'}
              </span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="absolute bottom-[120px] right-5 z-10 flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            disabled={isLoading}
            aria-label={isMuted ? (t('viewer.unmute') || 'Unmute video') : (t('viewer.mute') || 'Mute video')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:cursor-not-allowed disabled:bg-black/30"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/viewer/ad/${currentVideo.id}`)}
            disabled={isLoading}
            aria-label={t('viewer.fullscreen') || 'Open video in fullscreen'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:cursor-not-allowed disabled:bg-black/30"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Maximize2 className="h-5 w-5" />}
          </motion.button>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-6">
          {isLoading && (
            <div className="absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/80 px-4 py-2 text-xs text-white">
              {t('viewer.loading') || 'Loading...'}
            </div>
          )}
          {currentVideoIndex > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePreviousVideo}
              disabled={isLoading}
              aria-label={t('viewer.previousVideo') || 'Go to previous video'}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:cursor-not-allowed disabled:bg-black/30"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SkipForward className="h-5 w-5 rotate-180" />}
            </motion.button>
          )}

          {canSkip && currentVideoIndex < videos.length - 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleNextVideo}
              disabled={isProcessingReward}
              aria-label={t('viewer.nextVideo') || 'Go to next video'}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {isLoading ? <Loader2 className="h-10 w-10 animate-spin" /> : <SkipForward className="h-10 w-10" />}
            </motion.button>
          )}
        </div>

        {/* Prominent Next Button After Completion - RANDOM POSITION */}
        <AnimatePresence>
          {canSkip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute z-[15]"
              style={{ top: nextButtonPosition.top, left: nextButtonPosition.left, transform: 'translate(-50%, -50%)' }}
            >
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                animate={isLoading ? {} : { boxShadow: ['0 0 20px rgba(37,99,235,0.5)', '0 0 40px rgba(37,99,235,0.8)', '0 0 20px rgba(37,99,235,0.5)'] }}
                transition={isLoading ? {} : { duration: 2, repeat: Infinity }}
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    devLog('🎯 NEXT button clicked!');
                    devLog('🔍 Button state - canSkip:', canSkip, 'rewardEarned:', rewardEarned, 'currentVideoIndex:', currentVideoIndex);
                  }
                  handleNextVideo();
                }}
                disabled={isProcessingReward}
                aria-label={t('viewer.nextVideo') || 'Continue to next video'}
                className={cn(
                  'flex items-center gap-2 rounded-2xl border-2 border-white/40 px-6 py-3 text-base font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors md:px-8 md:py-4 md:text-lg',
                  isLoading ? 'bg-gray-500/90' : 'bg-blue-600/95 hover:bg-blue-700',
                  'disabled:cursor-not-allowed disabled:bg-gray-500/90',
                  'min-h-[54px] min-w-[140px] md:min-h-[62px] md:min-w-[180px]'
                )}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SkipForward className="h-5 w-5" />}
                {isLoading ? (t('viewer.loading') || 'Loading...') : (currentVideoIndex < videos.length - 1 ? (t('viewer.nextVideo') || 'NEXT') : (t('viewer.complete') || 'COMPLETE'))}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
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
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayPause}
                disabled={isLoading}
                aria-label={t('viewer.playVideo') || 'Play video'}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40"
              >
                {isLoading ? <Loader2 className="h-10 w-10 animate-spin" /> : <Play className="h-10 w-10" fill="white" />}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay for Reward Processing */}
        <AnimatePresence>
          {isProcessingReward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-1/2 top-1/2 z-[25] w-[90vw] max-w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/90 p-5 text-center backdrop-blur md:w-auto md:max-w-none"
            >
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500 md:h-10 md:w-10" />
              <p className="text-sm font-semibold text-white md:text-base">
                {t('viewer.processingReward') || 'Processing Reward...'}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {t('viewer.pleaseWait') || 'Please wait while we process your reward'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reward Completion Indicator */}
        <AnimatePresence>
          {rewardEarned && !isProcessingReward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-1/2 top-1/2 z-20 w-[95vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 text-center text-white"
            >
              <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-emerald-500 md:h-20 md:w-20" />
              <p className="mb-1 text-xl font-bold md:text-2xl">{t('viewer.videoCompleted')}</p>
              <p className="mb-1 text-lg font-semibold text-emerald-400 md:text-xl">
                +{t('currency.kwd')} {rewardAmount.toFixed(6)}
              </p>
              <p className="text-sm text-emerald-400/80">
                (+{(rewardAmount * 1000).toFixed(0)} {t('currency.fils')})
              </p>
              <div className="mt-4 rounded-xl bg-black/80 p-4">
                <p className="mb-1 text-sm font-semibold">🎯 {t('viewer.rewardEarned') || 'Reward Earned!'}</p>
                <p className="text-xs text-white/70">
                  {t('viewer.clickNextToContinue') || 'Click NEXT to continue to next video'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion Message for Last Video */}
        <AnimatePresence>
          {showCompletionMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="absolute left-1/2 top-1/2 z-20 w-[95vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-black/90 p-6 text-center text-white backdrop-blur md:max-w-[500px] md:p-8"
            >
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500 md:h-20 md:w-20" />
              <h3 className="mb-2 text-2xl font-bold text-emerald-400 md:text-3xl">
                🎉 {t('viewer.allVideosCompleted') || 'All Videos Completed!'}
              </h3>
              <p className="mb-2 text-sm text-white md:text-base">
                {t('viewer.congratulations') || 'Congratulations! You have completed all available videos in this section.'}
              </p>
              <p className="mb-5 text-xs text-white/70 md:text-sm">
                {t('viewer.rewardsCollected') || 'All rewards have been collected and added to your wallet.'}
              </p>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowCompletionMessage(false);
                  window.location.reload();
                }}
                className="w-full rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-blue-700 md:w-auto md:px-8 md:py-4 md:text-base"
              >
                {t('viewer.backToMain') || 'Back to Main'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Queue Preview */}
      <div className="absolute right-2.5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5 md:right-5 md:gap-2">
        {videos.slice(currentVideoIndex + 1, currentVideoIndex + 4).map((video) => (
          <div
            key={video.id}
            onClick={() => {
              if (canSkip) {
                devLog('🔄 User clicked on next video preview - allowed because canSkip is true');
                handleNextVideo();
              } else {
                devLog('🚫 User clicked on next video preview - blocked because canSkip is false');
              }
            }}
            className={cn(
              'relative flex h-[65px] w-[50px] items-center justify-center overflow-hidden rounded-xl border-2 transition-all duration-200 md:h-20 md:w-[60px] md:rounded-2xl',
              canSkip ? 'cursor-pointer border-white/30 opacity-100 hover:scale-105 hover:border-white/70' : 'cursor-not-allowed border-white/10 opacity-30 grayscale'
            )}
          >
            <div className={cn('flex h-full w-full items-center justify-center', isLoading ? 'bg-blue-600/80' : canSkip ? 'bg-black/50' : 'bg-black/80')}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Play className="h-4 w-4 text-white" fill={canSkip ? 'white' : 'transparent'} />}
            </div>
            {video?.is_watched && (
              <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/90"><Eye className="h-2.5 w-2.5 text-white" /></div>
            )}
            {!canSkip && (
              <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60"><Lock className="h-2.5 w-2.5 text-white" /></div>
            )}
          </div>
        ))}
      </div>

        {/* Video Counter */}
        <div className="absolute right-2.5 top-[5vh] z-10 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-sm md:right-5 md:top-5">
          <span className="text-xs font-semibold text-white tabular-nums">
            {isLoading ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {t('viewer.loading') || 'Loading...'}</span>
            ) : (
              `${currentVideoIndex + 1} / ${videos.length}`
            )}
          </span>
        </div>

        {/* Floating Animated Credit Bar */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-[5vh] z-20 -translate-x-1/2 md:top-5"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-black/80 px-5 py-2.5 shadow-2xl backdrop-blur-lg">
            <DollarSign className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span className="text-sm font-semibold text-white tabular-nums md:text-base">
              {isLoading ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('viewer.loading') || 'Loading...'}</span>
              ) : (
                `+${t('currency.kwd')} ${displayReward}`
              )}
            </span>
            {!isLoading && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            )}
          </div>
        </motion.div>

      {/* CTA Button */}
      {currentVideo?.cta_data?.enabled && currentVideo?.cta_data?.link && (
        <div className="absolute bottom-[20vh] right-2.5 z-[15] md:bottom-40 md:right-5">
          <motion.button
            whileHover={canSkip && !isLoading ? { y: -2, scale: 1.03 } : {}}
            whileTap={canSkip && !isLoading ? { scale: 0.97 } : {}}
            onClick={() => { if (canSkip && !isLoading) window.open(currentVideo.cta_data.link, '_blank'); }}
            disabled={!canSkip || isLoading}
            className={cn(
              'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all md:px-5 md:py-3 md:text-sm',
              canSkip && !isLoading ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg shadow-pink-500/40' : isLoading ? 'bg-blue-600/90' : 'bg-gray-500/60',
              'disabled:cursor-not-allowed disabled:opacity-70'
            )}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {currentVideo.cta_data.text || t('viewer.learnMore')}
          </motion.button>
          {!canSkip && (
            <span className="absolute -top-5 right-0 z-[16] whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white/70">
              {t('viewer.waitForCompletion') || 'Wait for completion'}
            </span>
          )}
        </div>
      )}

      {/* Comment Button */}
      <div className="absolute bottom-[15vh] right-2.5 z-[15] md:bottom-[120px] md:right-5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComments(true)}
          disabled={isLoading}
          aria-label={t('viewer.openComments') || 'Open comments'}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40 md:h-14 md:w-14"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
        </motion.button>
        {commentCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]">
            {commentCount > 99 ? '99+' : commentCount}
          </span>
        )}
        {!isLoading && commentCount === 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold text-white">?</span>
        )}
      </div>

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
      </div>
    </VideoPlayerErrorBoundary>
  );
}
