import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Dimensions, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { callEdgeFunction } from '../../src/lib/edgeFunctions';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';

const { width, height } = Dimensions.get('window');
// Calculate 9:16 dimensions with padding
const HORIZONTAL_PADDING = 16;
const ASPECT_RATIO = 9 / 16;
const CONTAINER_WIDTH = width - (HORIZONTAL_PADDING * 2);
const CONTAINER_HEIGHT = CONTAINER_WIDTH / ASPECT_RATIO;
const FEED_ITEM_HEIGHT = height; // Still use full height for the scroll snap

interface Ad {
  id: string;
  video_url: string;
  title: string;
  duration_seconds: number;
  reward_amount: number;
  is_on_cooldown: boolean;
}

function AdCard({ ad, isActive, isLast, onNext, onRefresh }: { ad: Ad; isActive: boolean; isLast: boolean; onNext: () => void; onRefresh: () => void }) {
  const videoRef = useRef<Video>(null);
  const { user } = useAuthStore();
  const [viewEventId, setViewEventId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [rewarded, setRewarded] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [onCooldown, setOnCooldown] = useState(ad.is_on_cooldown);

  // Generate a random position for the Next button (between 15% and 75% to stay on screen)
  const randomPosition = useMemo(() => ({
    top: `${Math.floor(Math.random() * 60) + 15}%`,
    left: `${Math.floor(Math.random() * 60) + 15}%`,
  }), [ad.id]);

  const rewardScale = useSharedValue(1);
  const rewardOpacity = useSharedValue(0);

  const rewardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));

  const startView = useCallback(async () => {
    if (!user || viewEventId || onCooldown) return;
    try {
      const data = await callEdgeFunction('start_ad_view', { ad_id: ad.id });
      if (data?.success) setViewEventId(data.view_event_id);
    } catch (err: any) {
      console.warn('Could not start view:', err.message);
    }
  }, [user, ad.id, viewEventId, onCooldown]);

  const completeView = useCallback(async () => {
    if (!viewEventId || rewarded || claiming || onCooldown) return;
    setClaiming(true);
    try {
      const data = await callEdgeFunction('complete_ad_view', {
        ad_id: ad.id,
        view_event_id: viewEventId,
      });
      if (!data?.success) throw new Error(data?.error || 'Failed to claim reward');
      
      setRewarded(true);
      setOnCooldown(true);

      rewardOpacity.value = withSequence(withSpring(1, { damping: 8 }), withSpring(1));
      rewardScale.value = withSequence(withSpring(1.3, { damping: 6 }), withSpring(1, { damping: 10 }));
      setTimeout(() => { rewardOpacity.value = withSpring(0); }, 2500);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setClaiming(false);
    }
  }, [viewEventId, rewarded, claiming, ad.id, onCooldown]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded || onCooldown) return;
    const dur = status.durationMillis || (ad.duration_seconds * 1000);
    const pos = status.positionMillis || 0;
    const pct = Math.min(pos / dur, 1);
    setProgress(pct);
    if (pct >= 0.95 && !rewarded) completeView();
  }, [ad.duration_seconds, rewarded, completeView, onCooldown]);

  return (
    <View style={styles.adCard}>
      {/* 9:16 Padded Video Container */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: ad.video_url }}
          style={styles.video}
          resizeMode={ResizeMode.COVER} // Fills the 9:16 container perfectly
          isLooping={onCooldown}
          shouldPlay={isActive}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onReadyForDisplay={startView}
        />
        
        {/* Dark bottom gradient for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        />

        {/* Top Progress Bar - Clean and Minimal */}
        {!onCooldown && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        {/* Ad Info - Glassmorphic Design */}
        <View style={styles.adInfoContainer}>
          <View style={styles.glassInfo}>
            <Text style={styles.adTitle}>{ad.title}</Text>
            {!onCooldown && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>Earn {formatKWD(ad.reward_amount)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Badge */}
        {(rewarded || (onCooldown && !rewarded)) && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {rewarded ? '✓ Earned' : '✓ Already Earned'}
            </Text>
          </View>
        )}

        {/* Randomized Next Button (Anti-Bot) */}
        {rewarded && (
          <TouchableOpacity
            style={[styles.nextButton, { top: randomPosition.top as any, left: randomPosition.left as any }]}
            onPress={isLast ? onRefresh : onNext}
            activeOpacity={0.9}
          >
            <Text style={styles.nextButtonText}>{isLast ? 'Refresh Feed 🔄' : 'Next Ad ⏭️'}</Text>
          </TouchableOpacity>
        )}

        {/* Cooldown Overlay */}
        {onCooldown && !rewarded && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownIcon}>⏰</Text>
            <Text style={styles.cooldownText}>24h Cooldown</Text>
            <Text style={styles.cooldownSubtext}>You've already earned from this ad!</Text>
          </View>
        )}
      </View>

      {/* Reward Animation (Keep outside to float above everything) */}
      <Animated.View style={[styles.rewardToast, rewardStyle]}>
        <Text style={styles.rewardToastText}>🎉 Reward Claimed!</Text>
        <Text style={styles.rewardToastAmount}>{formatKWD(ad.reward_amount)}</Text>
      </Animated.View>
    </View>
  );
}

export default function FeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ['active-ads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('rpc_get_viewer_ads', { p_user_id: user.id });
      if (error) throw error;
      
      // EXCLUDE all ads that are already on cooldown so they never appear in the feed
      const validAds = (data || []).filter((ad: any) => !ad.is_on_cooldown);
      return validAds;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

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
        <Text style={styles.emptyText}>End of the feed</Text>
        <Text style={styles.emptySubtext}>Check back later for new ads!</Text>
      </View>
    );
  }

  const handleNext = useCallback((currentIndex: number) => {
    if (currentIndex < ads.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [ads.length]);

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
            onNext={() => handleNext(index)}
            onRefresh={refetch}
          />
        )}
        pagingEnabled
        scrollEnabled={false} // Disable manual scrolling
        snapToInterval={FEED_ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        getItemLayout={(_, index) => ({ length: FEED_ITEM_HEIGHT, offset: FEED_ITEM_HEIGHT * index, index })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  loadingContainer: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  emptyContainer: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white },
  emptySubtext: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  
  adCard: { width, height: FEED_ITEM_HEIGHT, backgroundColor: Colors.black, justifyContent: 'center', alignItems: 'center' },
  videoContainer: { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, backgroundColor: '#111', overflow: 'hidden', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: '#222' },
  video: { ...StyleSheet.absoluteFillObject },
  
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250 },
  
  progressTrack: { position: 'absolute', top: 16, left: Spacing.md, right: Spacing.md, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, zIndex: 20 },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },

  adInfoContainer: { position: 'absolute', bottom: 20, left: Spacing.md, right: Spacing.md, zIndex: 10 },
  glassInfo: { backgroundColor: 'rgba(0,0,0,0.3)', padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: Spacing.xs },
  adTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.white, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  rewardPill: { backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  rewardPillText: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.primary },

  rewardToast: { position: 'absolute', alignSelf: 'center', top: '40%', backgroundColor: Colors.success, padding: Spacing.xl, borderRadius: BorderRadius.xl, alignItems: 'center', zIndex: 100, elevation: 20, shadowColor: Colors.success, shadowOpacity: 0.8, shadowRadius: 20 },
  rewardToastText: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.white },
  rewardToastAmount: { fontFamily: FontFamily.semiBold, fontSize: 24, color: Colors.white },

  statusBadge: { position: 'absolute', top: 16, right: Spacing.md, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, zIndex: 20 },
  statusBadgeText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.white },

  cooldownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  cooldownIcon: { fontSize: 48, marginBottom: Spacing.sm },
  cooldownText: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  cooldownSubtext: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  nextButton: {
    position: 'absolute',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 200,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nextButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.primary,
  },
});
