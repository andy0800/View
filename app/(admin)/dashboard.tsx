import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';

type AdminTab = 'pending' | 'ads' | 'finance';

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const queryClient = useQueryClient();
  const { signOut } = useAuthStore();
  const router = useRouter();

  // Pending advertiser approvals
  const { data: pendingAdvertisers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-advertisers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, company_name, commercial_license_number, authorized_signatory, phone_number, created_at')
        .eq('role', 'advertiser')
        .eq('status', 'pending')
        .order('created_at');
      return data || [];
    },
  });

  // Ads pending review
  const { data: pendingAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ['pending-ads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ads')
        .select('id, title, video_url, created_at, purchased_packages(advertiser_id, advertiser_packages(duration_seconds))')
        .eq('status', 'pending_review')
        .order('created_at');
      return data || [];
    },
  });

  // Finance overview
  const { data: finance, isLoading: financeLoading } = useQuery({
    queryKey: ['admin-finance'],
    queryFn: async () => {
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, type');
      const companyRevenue = txs?.filter(t => t.type === 'company_share').reduce((s: number, t: any) => s + t.amount, 0) ?? 0;
      const totalRewarded = txs?.filter(t => t.type === 'reward').reduce((s: number, t: any) => s + t.amount, 0) ?? 0;
      const totalWithdrawn = txs?.filter(t => t.type === 'withdrawal').reduce((s: number, t: any) => s + Math.abs(t.amount), 0) ?? 0;
      return { companyRevenue, totalRewarded, totalWithdrawn };
    },
  });

  const approveAdvertiser = async (id: string) => {
    const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', id);
    if (error) { Alert.alert('Error', error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['pending-advertisers'] });
    Alert.alert('Approved', 'Advertiser account activated.');
  };

  const rejectAdvertiser = async (id: string) => {
    Alert.alert('Reject Account', 'This will suspend the account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          await supabase.from('users').update({ status: 'suspended' }).eq('id', id);
          queryClient.invalidateQueries({ queryKey: ['pending-advertisers'] });
        }
      },
    ]);
  };

  const approveAd = async (id: string) => {
    await supabase.from('ads').update({ status: 'active' }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['pending-ads'] });
  };

  const rejectAd = async (id: string) => {
    await supabase.from('ads').update({ status: 'paused' }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['pending-ads'] });
  };

  const TAB_CONFIG: { key: AdminTab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Approvals', count: pendingAdvertisers.length },
    { key: 'ads', label: 'Ad Review', count: pendingAds.length },
    { key: 'finance', label: 'Finance' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={async () => { await signOut(); router.replace('/(auth)/welcome'); }}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TAB_CONFIG.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}{tab.count ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending Advertiser Approvals */}
        {activeTab === 'pending' && (
          pendingLoading ? <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} /> :
          pendingAdvertisers.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>✅ No pending approvals</Text></View>
          ) : (
            pendingAdvertisers.map((adv: any) => (
              <View key={adv.id} style={styles.card}>
                <Text style={styles.cardName}>{adv.company_name}</Text>
                <Text style={styles.cardDetail}>License: {adv.commercial_license_number}</Text>
                <Text style={styles.cardDetail}>Signatory: {adv.authorized_signatory}</Text>
                <Text style={styles.cardDetail}>Phone: {adv.phone_number}</Text>
                <Text style={styles.cardDate}>Applied: {new Date(adv.created_at).toLocaleDateString()}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => approveAdvertiser(adv.id)}>
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => rejectAdvertiser(adv.id)}>
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {/* Pending Ad Reviews */}
        {activeTab === 'ads' && (
          adsLoading ? <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} /> :
          pendingAds.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>✅ No ads pending review</Text></View>
          ) : (
            pendingAds.map((ad: any) => (
              <View key={ad.id} style={styles.card}>
                <Text style={styles.cardName}>{ad.title}</Text>
                <Text style={styles.cardDetail} numberOfLines={1}>URL: {ad.video_url}</Text>
                <Text style={styles.cardDetail}>Duration: {ad.purchased_packages?.advertiser_packages?.duration_seconds}s</Text>
                <Text style={styles.cardDate}>Submitted: {new Date(ad.created_at).toLocaleDateString()}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => approveAd(ad.id)}>
                    <Text style={styles.approveBtnText}>✓ Go Live</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => rejectAd(ad.id)}>
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {/* Finance Overview */}
        {activeTab === 'finance' && (
          financeLoading ? <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} /> : (
            <View style={styles.financeContainer}>
              <View style={[styles.financeCard, { borderLeftColor: Colors.success }]}>
                <Text style={styles.financeLabel}>Company Revenue</Text>
                <Text style={[styles.financeValue, { color: Colors.success }]}>{formatKWD(finance?.companyRevenue ?? 0)}</Text>
              </View>
              <View style={[styles.financeCard, { borderLeftColor: Colors.accent }]}>
                <Text style={styles.financeLabel}>Total Rewarded to Viewers</Text>
                <Text style={[styles.financeValue, { color: Colors.accent }]}>{formatKWD(finance?.totalRewarded ?? 0)}</Text>
              </View>
              <View style={[styles.financeCard, { borderLeftColor: Colors.error }]}>
                <Text style={styles.financeLabel}>Total Withdrawals Processed</Text>
                <Text style={[styles.financeValue, { color: Colors.error }]}>{formatKWD(finance?.totalWithdrawn ?? 0)}</Text>
              </View>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.white },
  signOutText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.error },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  tab: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.accent },
  tabText: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.textSecondary },
  tabTextActive: { color: Colors.accent },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs },
  cardName: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.white },
  cardDetail: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary },
  cardDate: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center' },
  approveBtn: { backgroundColor: Colors.success + '22', borderWidth: 1, borderColor: Colors.success },
  rejectBtn: { backgroundColor: Colors.error + '22', borderWidth: 1, borderColor: Colors.error },
  approveBtnText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.success },
  rejectBtnText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.error },
  empty: { paddingTop: Spacing.xl * 2, alignItems: 'center' },
  emptyText: { fontFamily: FontFamily.medium, fontSize: 16, color: Colors.textSecondary },
  financeContainer: { gap: Spacing.md },
  financeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, gap: 6 },
  financeLabel: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  financeValue: { fontFamily: FontFamily.bold, fontSize: 28 },
});
