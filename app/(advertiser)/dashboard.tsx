import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function AdvertiserDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();

  // REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!user) return;

    // Subscribe to any changes in relevant tables for this advertiser
    const channel = supabase
      .channel('advertiser-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ads' },
        () => {
          console.log('REALTIME: Ad change detected, refreshing dashboard...');
          queryClient.invalidateQueries({ queryKey: ['advertiser-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchased_packages' },
        () => {
          console.log('REALTIME: Package change detected, refreshing dashboard...');
          queryClient.invalidateQueries({ queryKey: ['advertiser-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['advertiser-stats', user?.id],
    queryFn: async () => {
      console.log('DEBUG: Fetching stats for User ID:', user?.id);
      
      // Direct call to Supabase - bypasses local mocks
      const { data: packages, error } = await supabase
        .from('purchased_packages')
        .select('total_budget, remaining_budget, status, ads(current_views, target_views, status)')
        .eq('advertiser_id', user!.id);
      
      if (error) {
        console.error('DEBUG: Supabase Error:', error);
        throw error;
      }

      console.log('DEBUG: Raw Packages Data:', packages);

      // Ensure we have an array, even if empty
      const safePackages = packages || [];

      const totalBudget = safePackages.reduce((s: number, p: any) => s + (Number(p.total_budget) || 0), 0);
      const totalRemaining = safePackages.reduce((s: number, p: any) => s + (Number(p.remaining_budget) || 0), 0);
      const totalSpent = totalBudget - totalRemaining;

      const totalViews = safePackages.reduce((s: number, p: any) => {
        if (!p.ads) return s;
        const adsArray = Array.isArray(p.ads) ? p.ads : [p.ads];
        return s + adsArray.reduce((a: number, ad: any) => a + (ad.current_views || 0), 0);
      }, 0);
      
      const totalPackagesCount = safePackages.length;
      const activeAdsCount = safePackages.reduce((s: number, p: any) => {
        if (!p.ads) return s;
        const adsArray = Array.isArray(p.ads) ? p.ads : [p.ads];
        return s + adsArray.filter((ad: any) => ad.status === 'active').length;
      }, 0);

      return { totalSpent, totalRemaining, totalViews, totalPackagesCount, activeAdsCount, totalBudget };
    },
    enabled: !!user,
    staleTime: 0, // Disable caching - always fetch fresh
    gcTime: 0,    // Do not keep old data in memory
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.companyName}>{profile?.company_name || 'Advertiser'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: Colors.success + '22' }]}>
            <Text style={[styles.statusPillText, { color: Colors.success }]}>● Account Active</Text>
          </View>
        </View>

        {/* Analytics Section */}
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Total Viewers" value={(stats?.totalViews ?? 0).toLocaleString()} color={Colors.success} />
            <StatCard label="Active Ads" value={`${stats?.activeAdsCount ?? 0} / ${stats?.totalPackagesCount ?? 0}`} color="#00D1FF" />
            <StatCard label="Total Spent" value={formatKWD(stats?.totalSpent ?? 0)} color={Colors.error} />
            <StatCard label="Remaining" value={formatKWD(stats?.totalRemaining ?? 0)} color={Colors.accent} />
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(advertiser)/packages')}>
            <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.actionGradient}>
              <Text style={styles.actionEmoji}>📦</Text>
              <Text style={styles.actionLabel}>Buy Package</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(advertiser)/ads')}>
            <View style={[styles.actionGradient, { backgroundColor: Colors.surface }]}>
              <Text style={styles.actionEmoji}>🎬</Text>
              <Text style={[styles.actionLabel, { color: Colors.white }]}>Manage Ads</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoTitle}>Revenue Split</Text>
          <Text style={styles.infoText}>50% of your ad budget goes to viewers as rewards. 50% is retained as platform commission.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: Spacing.md },
  greeting: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  companyName: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.white },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusPillText: { fontFamily: FontFamily.medium, fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 3, gap: 4,
  },
  statValue: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  statLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: 17, color: Colors.white },
  actionsGrid: { flexDirection: 'row', gap: Spacing.sm },
  actionCard: { flex: 1, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  actionGradient: {
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.xl,
  },
  actionEmoji: { fontSize: 32 },
  actionLabel: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.primary },
  infoNote: {
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.accent, gap: 4,
  },
  infoTitle: { fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.accent },
  infoText: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
