import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Film, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

import TikTokVideoPlayer from './TikTokVideoPlayer';
import { getAllAdsRandomly } from '../api/viewer';

export default function AllAdsTab() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const { t } = useTranslation();
  const { currentLanguage, isRTL } = useLanguage();

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
      // FIXED: now uses backend response, no local mutation
      const reward = Number(rewardAmount) || 0;
      if (reward > 0) {
        setRewardAmount(reward);
        setShowRewardAlert(true);
      }
      
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

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-12 w-12 text-blue-600 md:h-16 md:w-16" />
        </motion.div>
        <p className={cn(
          'text-lg font-semibold text-slate-500 md:text-xl',
          isRTL && 'font-arabic'
        )}>
          {t('common.loading')} {t('viewer.allAds')}...
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <p className={cn('text-sm font-medium text-red-800', isRTL && 'font-arabic')}>
          {error}
        </p>
      </motion.div>
    );
  }

  /* ── Empty state ── */
  if (videos.length === 0) {
    return (
      <div className={cn('py-16 text-center md:py-20', isRTL && 'font-arabic')}>
        <Film className="mx-auto mb-4 h-14 w-14 text-slate-300" />
        <h4 className="text-xl font-bold text-slate-600 md:text-2xl">
          {t('viewer.noAdsAvailable')}
        </h4>
        <p className="mt-2 text-base text-slate-400 md:text-lg">
          {t('viewer.checkBackLaterForAds')}
        </p>
      </div>
    );
  }

  /* ── Main content ── */
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="relative min-h-screen bg-transparent">
      <TikTokVideoPlayer
        videos={videos}
        onVideoComplete={handleVideoComplete}
        onEarnCredits={handleEarnCredits}
      />

      {/* ── Reward toast ── */}
      <AnimatePresence>
        {showRewardAlert && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-xl shadow-emerald-100/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className={cn(
                'text-sm font-semibold text-emerald-800',
                isRTL && 'font-arabic'
              )}>
                {t('viewer.rewardEarned', { amount: rewardAmount.toFixed(6) })} — {(rewardAmount * 1000).toFixed(0)} {t('currency.fils')}
              </span>
              <button
                onClick={() => setShowRewardAlert(false)}
                className="ml-2 rounded-lg p-1 transition hover:bg-emerald-100"
              >
                <X className="h-4 w-4 text-emerald-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
