import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

const { height } = Dimensions.get('window');

const RoleCard = ({
  title,
  subtitle,
  emoji,
  accentColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
    <View style={[styles.cardIconBg, { backgroundColor: accentColor + '22' }]}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
    </View>
    <View style={styles.cardTextContainer}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <View style={[styles.cardArrow, { backgroundColor: accentColor + '22' }]}>
      <Text style={[styles.cardArrowText, { color: accentColor }]}>→</Text>
    </View>
  </TouchableOpacity>
);

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#060F22', '#0A1F44', '#060F22']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Choose Account Type</Text>
          <Text style={styles.subheading}>
            Select how you'll be using the VIEW platform
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <RoleCard
            title="Viewer Account"
            subtitle="Watch ads and earn KWD rewards directly to your wallet."
            emoji="👁"
            accentColor={Colors.success}
            onPress={() => router.push('/(auth)/viewer-register')}
          />
          <RoleCard
            title="Advertiser Account"
            subtitle="Promote your business to targeted audiences with flexible budgets."
            emoji="📣"
            accentColor={Colors.accent}
            onPress={() => router.push('/(auth)/advertiser-register')}
          />
        </View>

        <Text style={styles.footerNote}>
          Both account types require identity verification. Advertiser accounts
          are additionally reviewed by our team.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  backBtn: { marginBottom: Spacing.xl },
  backBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  headerContainer: { marginBottom: Spacing.xl, gap: Spacing.xs },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.white,
  },
  subheading: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  cardsContainer: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIconBg: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28 },
  cardTextContainer: { flex: 1, gap: 4 },
  cardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: Colors.white,
  },
  cardSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: { fontSize: 18, fontFamily: FontFamily.bold },
  footerNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
});
