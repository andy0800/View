import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, Dimensions, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Linking, AppState, AppStateStatus
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat, Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { callEdgeFunction } from '../../src/lib/edgeFunctions';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';
import LikeButton from '../../src/components/LikeButton';
import CommentSheet from '../../src/components/CommentSheet';

const { width, height } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const ASPECT_RATIO = 9 / 16;
const CONTAINER_WIDTH = width - HORIZONTAL_PADDING * 2;
const CONTAINER_HEIGHT = CONTAINER_WIDTH / ASPECT_RATIO;
const FEED_ITEM_HEIGHT = height;

interface Ad {
  id: string;
  video_url: string;
  title: string;
  duration_seconds: number;
  reward_amount: number;
  is_on_cooldown: boolean;
  cta_url?: string;
  likes_count: number;
  viewer_has_liked: boolean;
}

interface AdCardProps {
  ad: Ad;
  isActive: boolean;
  isLast: boolean;
  isViolated: boolean;
  skipCountdown: number | null;
  onViewStarted: (viewEventId: string) => void;
  onViewRewarded: () => void;
  onNext: () => void;
  onRefresh: () => void;
  onLikeToggle: (adId: string) => void;
  onCommentPress: (adId: string) => void;
}

// ─── AdCard ────────────────────────────────────────────────────────────────
function AdCard({
  ad, isActive, isLast, isViolated, skipCountdown,
  onViewStarted, onViewRewarded, onNext, onRefresh,
  onLikeToggle, onCommentPress,
}: AdCardProps) {
  const videoRef = useRef<Video>(null);
  const { user } = useAuthStore();
  const [viewEventId, setViewEventId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [rewarded, setRewarded] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const rewardScale = useSharedValue(1);
  const rewardOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.2);
  const glowScale = useSharedValue(1);

  const rewardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));

  const randomPosition = useMemo(() => ({
    top: `${Math.floor(Math.random() * 55) + 15}%`,
    left: `${Math.floor(Math.random() * 55) + 10}%`,
  }), [ad.id]);

  const startView = useCallback(async () => {
    if (!user || viewEventId || isViolated || ad.is_on_cooldown) return;
    try {
      const data = await callEdgeFunction('start_ad_view', { ad_id: ad.id });
      if (data?.success) {
        setViewEventId(data.view_event_id);
        onViewStarted(data.view_event_id);
      }
    } catch (err: any) {
      console.warn('Could not start view:', err.message);
    }
  }, [user, ad.id, viewEventId, isViolated, ad.is_on_cooldown, onViewStarted]);

  const completeView = useCallback(async () => {
    if (!viewEventId || rewarded || claiming || isViolated) return;
    setClaiming(true);
    try {
      const data = await callEdgeFunction('complete_ad_view', {
        ad_id: ad.id,
        view_event_id: viewEventId,
      });
      if (!data?.success) throw new Error(data?.error || 'Failed to claim reward');
      setRewarded(true);
      onViewRewarded();
      rewardOpacity.value = withSequence(withSpring(1, { damping: 8 }), withSpring(1));
      rewardScale.value = withSequence(withSpring(1.3, { damping: 6 }), withSpring(1, { damping: 10 }));
      setTimeout(() => { rewardOpacity.value = withSpring(0); }, 2500);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setClaiming(false);
    }
  }, [viewEventId, rewarded, claiming, ad.id, isViolated, onViewRewarded]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded || isViolated || ad.is_on_cooldown) return;
    const dur = status.durationMillis || ad.duration_seconds * 1000;
    const pos = status.positionMillis || 0;
    const pct = Math.min(pos / dur, 1);
    setProgress(pct);
    if (pct >= 0.95 && !rewarded) completeView();

    // CTA Glow trigger at 60%
    if (pct >= 0.6 && glowOpacity.value === 0.2) {
      glowOpacity.value = withTiming(1, { duration: 500 });
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true
      );
    }
  }, [ad.duration_seconds, rewarded, completeView, isViolated, ad.is_on_cooldown, glowOpacity, glowScale]);

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const showCooldown = ad.is_on_cooldown && !isViolated;

  const handleCTAPress = () => {
    if (ad.cta_url) {
      Linking.openURL(ad.cta_url).catch(() => Alert.alert('Invalid URL', 'Could not open the link.'));
    }
  };

  return (
    <View style={styles.adCard}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: ad.video_url }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping={showCooldown}
          shouldPlay={isActive && !isViolated && !ad.is_on_cooldown}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onReadyForDisplay={startView}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomGradient}
        />

        {/* Progress Bar */}
        {!showCooldown && !isViolated && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        {/* CTA Button Overlay */}
        {ad.cta_url && !isViolated && !showCooldown && (
          <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
            <TouchableOpacity style={styles.ctaButton} onPress={handleCTAPress} activeOpacity={0.8}>
              <Text style={styles.ctaButtonText}>Learn More</Text>
              <Ionicons name="chevron-forward" size={16} color="#000" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Earned Badge */}
        {rewarded && !isViolated && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>✓ Earned</Text>
          </View>
        )}

        {/* Randomized Next Button */}
        {rewarded && !isViolated && (
          <TouchableOpacity
            style={[styles.nextButton, { top: randomPosition.top as any, left: randomPosition.left as any }]}
            onPress={isLast ? onRefresh : onNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>{isLast ? 'Refresh 🔄' : 'Next ⏭️'}</Text>
          </TouchableOpacity>
        )}

        {/* VIOLATION OVERLAY — takes full priority */}
        {isViolated && (
          <View style={styles.violationOverlay}>
            <Text style={styles.violationIcon}>🚫</Text>
            <Text style={styles.violationTitle}>Violation Detected</Text>
            <Text style={styles.violationSubtext}>
              {'You left the ad mid-view.\nA 24h cooldown has been applied\nwith no reward.'}
            </Text>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>
                Skipping in {skipCountdown ?? 3}s...
              </Text>
            </View>
          </View>
        )}

        {/* Standard Cooldown Overlay */}
        {showCooldown && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownIcon}>⏰</Text>
            <Text style={styles.cooldownText}>24h Cooldown</Text>
            <Text style={styles.cooldownSubtext}>You've already earned from this ad!</Text>
          </View>
        )}
      </View>

      {/* ── Info Bar — OUTSIDE the video container ── */}
      {!isViolated && (
        <View style={styles.infoBar}>
          <View style={styles.infoBarLeft}>
            <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
            
            <View style={styles.actionsRow}>
              <LikeButton
                isLiked={ad.viewer_has_liked}
                likeCount={ad.likes_count}
                onPress={() => onLikeToggle(ad.id)}
              />
              <TouchableOpacity style={styles.commentBtn} onPress={() => onCommentPress(ad.id)}>
                <Ionicons name="chatbubble-outline" size={24} color="#FFF" style={styles.actionIconShadow} />
                <Text style={styles.actionCount}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBarRight}>
            {!showCooldown && !rewarded && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>💰 {formatKWD(ad.reward_amount)}</Text>
              </View>
            )}
            {rewarded && (
              <View style={styles.earnedPill}>
                <Text style={styles.earnedPillText}>✓ Earned</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Reward Toast floats above card */}
      <Animated.View style={[styles.rewardToast, rewardStyle]}>
        <Text style={styles.rewardToastText}>🎉 Reward Claimed!</Text>
        <Text style={styles.rewardToastAmount}>{formatKWD(ad.reward_amount)}</Text>
      </Animated.View>
    </View>
  );
}

// ─── FeedScreen ────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [violatedAdId, setViolatedAdId] = useState<string | null>(null);
  const [skipCountdown, setSkipCountdown] = useState<number | null>(null);
  const [commentAdId, setCommentAdId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Single mutable ref for the currently active view — safe to read in callbacks
  const activeViewRef = useRef<{ adId: string | null; viewEventId: string | null; rewarded: boolean }>({
    adId: null, viewEventId: null, rewarded: false,
  });

  const { data: ads = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['active-ads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('rpc_get_viewer_ads', { p_user_id: user.id });
      if (error) throw error;
      // Only show ads NOT on cooldown
      return (data || []).filter((ad: any) => !ad.is_on_cooldown);
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 60000,
  });

  // ── REFRESH HANDLER — resets all scroll + state then refetches ───────────
  const handleRefresh = useCallback(async () => {
    setActiveIndex(0);
    setViolatedAdId(null);
    setSkipCountdown(null);
    setCommentAdId(null);
    activeViewRef.current = { adId: null, viewEventId: null, rewarded: false };
    await refetch();
    // Scroll back to top after data arrives
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }, 100);
  }, [refetch]);

  // ── LIKE HANDLER (Optimistic Update) ─────────────────────────────────────
  const handleLikeToggle = async (adId: string) => {
    if (!user) return;
    
    // Optimistic UI update
    queryClient.setQueryData(['active-ads', user.id], (oldAds: any[]) => {
      if (!oldAds) return oldAds;
      return oldAds.map(ad => {
        if (ad.id === adId) {
          const newLikedState = !ad.viewer_has_liked;
          return {
            ...ad,
            viewer_has_liked: newLikedState,
            likes_count: newLikedState ? ad.likes_count + 1 : Math.max(ad.likes_count - 1, 0),
          };
        }
        return ad;
      });
    });

    // Fire to DB
    const { error } = await supabase.rpc('rpc_toggle_ad_like', {
      p_ad_id: adId,
      p_viewer_id: user.id
    });
    if (error) {
      console.error("Failed to toggle like:", error);
      // Rollback on failure
      refetch();
    }
  };

  const fireViolation = useCallback(async () => {
    const { adId, viewEventId, rewarded } = activeViewRef.current;
    // Guard: only fire if a view is actually in progress
    if (!adId || !viewEventId || rewarded) return;
    // Guard: already violated this ad
    if (violatedAdId === adId) return;

    console.log('VIOLATION: Detected for ad', adId);
    // Mark rewarded immediately to prevent double-fire
    activeViewRef.current.rewarded = true;
    setViolatedAdId(adId);
    setSkipCountdown(3);

    try {
      await supabase.rpc('rpc_void_ad_view', {
        p_ad_id: adId,
        p_viewer_id: user!.id,
      });
      console.log('VIOLATION: Recorded in DB for ad', adId);
    } catch (err: any) {
      console.warn('VIOLATION: Could not record in DB:', err.message);
    }
  }, [user, violatedAdId]);

  // ── APP BACKGROUND DETECTION ─────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        fireViolation();
      }
    });
    return () => sub.remove();
  }, [fireViolation]);

  // ── NAVIGATION AWAY DETECTION ─────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Runs when this screen loses focus (tab switch / navigation)
        fireViolation();
      };
    }, [fireViolation])
  );

  // ── AUTO-SKIP COUNTDOWN ───────────────────────────────────────────────────
  useEffect(() => {
    if (skipCountdown === null) return;
    if (skipCountdown === 0) {
      // Advance to next ad
      const nextIndex = activeIndex + 1;
      if (nextIndex < ads.length) {
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
        activeViewRef.current = { adId: ads[nextIndex]?.id ?? null, viewEventId: null, rewarded: false };
      } else {
        refetch(); // No more ads — refresh
      }
      setViolatedAdId(null);
      setSkipCountdown(null);
      return;
    }
    const timer = setTimeout(() => setSkipCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(timer);
  }, [skipCountdown, activeIndex, ads, refetch]);

  // ── VIEWABILITY ───────────────────────────────────────────────────────────
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setActiveIndex(idx);
      activeViewRef.current = { adId: ads[idx]?.id ?? null, viewEventId: null, rewarded: false };
    }
  }, [ads]);

  const handleNext = useCallback((currentIndex: number) => {
    if (currentIndex < ads.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [ads.length]);

  // ── LOADING / EMPTY ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Curating your feed...</Text>
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📺</Text>
        <Text style={styles.emptyText}>No ads available right now</Text>
        <Text style={styles.emptySubtext}>Check back later for new content!</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, isFetching && { opacity: 0.6 }]}
          onPress={handleRefresh}
          disabled={isFetching}
        >
          {isFetching
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.refreshBtnText}>Refresh Feed</Text>
          }
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FlatList
        ref={flatListRef}
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AdCard
            ad={item}
            isActive={index === activeIndex}
            isLast={index === ads.length - 1}
            isViolated={violatedAdId === item.id}
            skipCountdown={violatedAdId === item.id ? skipCountdown : null}
            onViewStarted={(viewEventId) => {
              activeViewRef.current = { adId: item.id, viewEventId, rewarded: false };
            }}
            onViewRewarded={() => {
              activeViewRef.current.rewarded = true;
            }}
            onNext={() => handleNext(index)}
            onRefresh={handleRefresh}
            onLikeToggle={handleLikeToggle}
            onCommentPress={setCommentAdId}
          />
        )}
        pagingEnabled
        scrollEnabled={!commentAdId} // Disable scroll when sheet is open
        snapToInterval={FEED_ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        getItemLayout={(_, index) => ({ length: FEED_ITEM_HEIGHT, offset: FEED_ITEM_HEIGHT * index, index })}
      />

      {/* Render the Comment Sheet over the entire screen */}
      <CommentSheet
        adId={commentAdId}
        onClose={() => setCommentAdId(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060F' },
  loadingContainer: { flex: 1, backgroundColor: '#06060F', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  emptyContainer: { flex: 1, backgroundColor: '#06060F', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white },
  emptySubtext: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  refreshBtn: { marginTop: Spacing.md, backgroundColor: '#F5B400', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  refreshBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#000' },

  adCard: {
    width,
    height: FEED_ITEM_HEIGHT,
    backgroundColor: '#06060F',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  videoContainer: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    backgroundColor: '#0D0D18',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(245,180,0,0.25)',
    shadowColor: '#F5B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 18,
  },
  video: { ...StyleSheet.absoluteFillObject },

  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },

  progressTrack: {
    position: 'absolute', top: 12,
    left: 14, right: 14, height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2, zIndex: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5B400',
    borderRadius: 2,
    shadowColor: '#F5B400',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  // Info bar sits BELOW the video container
  infoBar: {
    width: CONTAINER_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoBarLeft: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12, 
    gap: 8 
  },
  infoBarRight: { alignItems: 'flex-end' },
  adTitle: { 
    fontFamily: FontFamily.bold, 
    fontSize: 15, 
    color: '#FFFFFF', 
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionIconShadow: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actionCount: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  ctaContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    zIndex: 150,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5B400',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 6,
    shadowColor: '#F5B400',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#000',
  },

  rewardPill: {

    backgroundColor: '#F5B400',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50,
    shadowColor: '#F5B400',
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  rewardPillText: { fontFamily: FontFamily.bold, fontSize: 13, color: '#000' },
  earnedPill: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50,
  },
  earnedPillText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: '#fff' },

  rewardToast: { position: 'absolute', alignSelf: 'center', top: '38%', backgroundColor: Colors.success, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center', gap: Spacing.xs, zIndex: 100, elevation: 20, shadowColor: Colors.success, shadowOpacity: 0.9, shadowRadius: 24 },
  rewardToastText: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.white },
  rewardToastAmount: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white },

  statusBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: Colors.success + 'CC',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50, zIndex: 20,
  },
  statusBadgeText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.white },

  nextButton: {
    position: 'absolute',
    backgroundColor: '#F5B400',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 2, borderColor: '#fff',
    zIndex: 200, elevation: 16,
    shadowColor: '#F5B400', shadowOpacity: 1, shadowRadius: 20,
  },
  nextButtonText: { fontFamily: FontFamily.bold, fontSize: 15, color: '#000' },

  violationOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(130,0,0,0.94)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md, zIndex: 50 },
  violationIcon: { fontSize: 54 },
  violationTitle: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.white, textAlign: 'center' },
  violationSubtext: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  countdownBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  countdownText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.white },

  cooldownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  cooldownIcon: { fontSize: 48 },
  cooldownText: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  cooldownSubtext: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
