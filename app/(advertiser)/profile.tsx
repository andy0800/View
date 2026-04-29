import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

export default function AdvertiserProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Company Profile</Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.company_name?.[0] || 'A'}</Text>
          </View>
          <View>
            <Text style={styles.companyName}>{profile?.company_name}</Text>
            <View style={[styles.badge, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.badgeText, { color: Colors.accent }]}>📣 Advertiser</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Information</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Company Name</Text><Text style={styles.rowValue}>{profile?.company_name}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>License Number</Text><Text style={styles.rowValue}>{profile?.commercial_license_number}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Authorized Signatory</Text><Text style={styles.rowValue}>{profile?.authorized_signatory}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Phone</Text><Text style={styles.rowValue}>{profile?.phone_number}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Status</Text>
            <Text style={[styles.rowValue, { color: profile?.status === 'active' ? Colors.success : Colors.accent }]}>
              {profile?.status === 'active' ? 'Active' : 'Pending'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white, paddingTop: Spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.accent },
  avatarText: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.accent },
  companyName: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.white },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: 4 },
  badgeText: { fontFamily: FontFamily.medium, fontSize: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.white, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  rowLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  rowValue: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.white, flex: 1, textAlign: 'right' },
  signOutBtn: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '44' },
  signOutText: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.error },
});
