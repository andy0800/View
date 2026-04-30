import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily } from '../lib/theme';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function LikeButton({ isLiked, likeCount, onPress }: LikeButtonProps) {
  const scale = useSharedValue(1);

  // Trigger animation when isLiked changes externally (or internally)
  useEffect(() => {
    if (isLiked) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    } else {
      scale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }
  }, [isLiked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Optimistic haptic feedback
    if (isLiked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, isLiked && styles.iconLiked]}>
        {isLiked ? '❤️' : '🤍'}
      </Text>
      <Text style={styles.count}>{likeCount}</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  icon: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  iconLiked: {
    // Adding extra glow to the liked heart
    textShadowColor: 'rgba(255, 50, 50, 0.6)',
    textShadowRadius: 8,
  },
  count: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: '#fff',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
