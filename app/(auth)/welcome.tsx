import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#060F22', '#0A1F44', '#060F22']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Decorative glow */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.content}>
        {/* Logo / Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>V</Text>
          </View>
          <Text style={styles.brandName}>VIEW</Text>
          <Text style={styles.tagline}>Earn while you watch</Text>
        </View>

        {/* Bottom CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaHeading}>Get started</Text>
          <Text style={styles.ctaSubtitle}>
            Choose your account type to continue
          </Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/role-select')}
          >
            <LinearGradient
              colors={['#F5B400', '#D49E00']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnPrimaryText}>Create an Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.btnSecondaryText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: Spacing.xxl,
  },
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F5B40022',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#16C78422',
  },
  logoContainer: { alignItems: 'center', gap: Spacing.sm },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  logoText: {
    fontFamily: FontFamily.bold,
    fontSize: 52,
    color: Colors.primary,
  },
  brandName: {
    fontFamily: FontFamily.bold,
    fontSize: 36,
    color: Colors.white,
    letterSpacing: 8,
    marginTop: Spacing.sm,
  },
  tagline: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  ctaContainer: { gap: Spacing.md },
  ctaHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.white,
  },
  ctaSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  btnPrimary: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.primary,
  },
  btnSecondary: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
