import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

const ProfileRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

export default function ViewerProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase() || 'V'}</Text>
          </View>
          <Text style={styles.username}>@{profile?.username}</Text>
          <View style={[styles.statusBadge, { backgroundColor: Colors.success + '22' }]}>
            <Text style={[styles.statusText, { color: Colors.success }]}>
              ● Active Viewer
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <ProfileRow label="Full Name" value={profile?.full_name} />
          <ProfileRow label="Phone Number" value={profile?.phone_number} />
          <ProfileRow label="Civil ID" value={profile?.civil_id_number ? `••••${profile.civil_id_number.slice(-4)}` : undefined} />
          <ProfileRow label="Role" value="Viewer" />
          <ProfileRow label="Account Status" value="Active" />
        </View>

        {/* Security Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security</Text>
          <Text style={styles.securityNote}>
            🔒  Your Civil ID and personal data are encrypted and stored securely. We never share your information with third parties.
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white, marginTop: Spacing.md },
  avatarContainer: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.accent,
  },
  avatarText: { fontFamily: FontFamily.bold, fontSize: 32, color: Colors.accent },
  username: { fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.white },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontFamily: FontFamily.medium, fontSize: 13 },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.white, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  rowLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  rowValue: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.white },
  securityNote: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  signOutBtn: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '44',
  },
  signOutText: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.error },
});
