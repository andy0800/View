import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#060F22', '#0A1F44', '#060F22']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.heading}>Account Under Review</Text>
        <Text style={styles.body}>
          Your advertiser account has been submitted for manual verification by our team.{'\n\n'}
          This process typically takes 1–2 business days. You'll receive a notification once your account is approved.
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoItem}>✅  Our team reviews your commercial license</Text>
          <Text style={styles.infoItem}>✅  Identity verification is confirmed</Text>
          <Text style={styles.infoItem}>✅  Account activated — you can start running ads</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={async () => { await signOut(); router.replace('/(auth)/welcome'); }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl * 2, alignItems: 'center', gap: Spacing.lg },
  icon: { fontSize: 64 },
  heading: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white, textAlign: 'center' },
  body: { fontFamily: FontFamily.regular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '100%', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  infoTitle: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.white, marginBottom: Spacing.xs },
  infoItem: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  signOutBtn: { marginTop: 'auto', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  signOutText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
});
