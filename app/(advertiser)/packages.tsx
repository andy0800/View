import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { callEdgeFunction } from '../../src/lib/edgeFunctions';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';

const PACKAGE_ICONS: Record<number, string> = { 10: '⚡', 15: '🎯', 20: '🚀', 30: '👑' };

export default function PackagesScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [budget, setBudget] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  // REAL-TIME SUBSCRIPTION
  React.useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('advertiser-packages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertiser_packages' },
        () => {
          console.log('REALTIME: Advertiser packages changed, refreshing...');
          queryClient.invalidateQueries({ queryKey: ['advertiser-packages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['advertiser-packages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('advertiser_packages')
        .select('*')
        .eq('is_active', true)
        .order('duration_seconds');
      return data || [];
    },
  });

  const handlePurchase = async () => {
    if (!selectedPkg || !user) return;
    const budgetKWD = parseFloat(budget);
    if (isNaN(budgetKWD) || budgetKWD < 300) {
      Alert.alert('Invalid Budget', 'Minimum budget is 300 KWD.');
      return;
    }
    if (budgetKWD % 100 !== 0) {
      Alert.alert('Invalid Budget', 'Budget must be in increments of 100 KWD.');
      return;
    }
    setPurchasing(true);
    try {
      // Call the Edge Function — this uses the service role key on the server
      // and bypasses RLS securely. Direct DB inserts are blocked by RLS.
      await callEdgeFunction('purchase_package', {
        package_id: selectedPkg.id,
        budget_kwd: budgetKWD,
      });

      // Invalidate relevant queries so dashboard and ads list refresh immediately
      await queryClient.invalidateQueries({ queryKey: ['available-pkgs'] });
      await queryClient.invalidateQueries({ queryKey: ['advertiser-stats'] });

      Alert.alert(
        '✅ Package Purchased!',
        `${budgetKWD} KWD budget added for your ${selectedPkg.duration_seconds}s ad package.`,
        [{ text: 'OK', onPress: () => { setSelectedPkg(null); setBudget(''); } }]
      );
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Ad Packages</Text>
        <Text style={styles.subtitle}>Select a package based on your ad duration and budget.</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
        ) : (
          packages.map((pkg: any) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.pkgCard, selectedPkg?.id === pkg.id && styles.pkgCardSelected]}
              onPress={() => setSelectedPkg(selectedPkg?.id === pkg.id ? null : pkg)}
              activeOpacity={0.85}
            >
              <View style={styles.pkgHeader}>
                <View style={styles.pkgIconContainer}>
                  <Text style={styles.pkgIcon}>{PACKAGE_ICONS[pkg.duration_seconds] || '📺'}</Text>
                </View>
                <View style={styles.pkgInfo}>
                  <Text style={styles.pkgDuration}>{pkg.duration_seconds}s Ad Package</Text>
                  <Text style={styles.pkgPricePerView}>{formatKWD(pkg.price_per_view)} per view</Text>
                </View>
                {selectedPkg?.id === pkg.id && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.pkgStats}>
                <View style={styles.pkgStat}>
                  <Text style={styles.pkgStatLabel}>Viewer Reward</Text>
                  <Text style={[styles.pkgStatValue, { color: Colors.success }]}>{formatKWD(pkg.reward_amount)}</Text>
                </View>
                <View style={styles.pkgDivider} />
                <View style={styles.pkgStat}>
                  <Text style={styles.pkgStatLabel}>Platform Fee</Text>
                  <Text style={[styles.pkgStatValue, { color: Colors.accent }]}>{formatKWD(pkg.company_amount)}</Text>
                </View>
                <View style={styles.pkgDivider} />
                <View style={styles.pkgStat}>
                  <Text style={styles.pkgStatLabel}>Min Budget</Text>
                  <Text style={styles.pkgStatValue}>300 KWD</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Budget Input */}
        {selectedPkg && (
          <View style={styles.budgetSection}>
            <Text style={styles.budgetTitle}>Set Your Budget</Text>
            <Text style={styles.budgetHint}>Minimum 300 KWD · Increments of 100 KWD</Text>
            <View style={styles.budgetInputRow}>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="e.g. 500"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.budgetCurrency}>KWD</Text>
            </View>
            {budget && !isNaN(parseFloat(budget)) && (
              <Text style={styles.budgetCalc}>
                ≈ {Math.floor(parseFloat(budget) * 1_000_000 / selectedPkg.price_per_view).toLocaleString()} total views
              </Text>
            )}
            <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase} disabled={purchasing}>
              <LinearGradient colors={['#F5B400', '#D49E00']} style={styles.purchaseBtnGradient}>
                {purchasing ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.purchaseBtnText}>Purchase Package</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white, paddingTop: Spacing.md },
  subtitle: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  pkgCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  pkgCardSelected: { borderColor: Colors.accent, backgroundColor: Colors.primaryLight },
  pkgHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pkgIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent + '22', alignItems: 'center', justifyContent: 'center' },
  pkgIcon: { fontSize: 24 },
  pkgInfo: { flex: 1 },
  pkgDuration: { fontFamily: FontFamily.bold, fontSize: 17, color: Colors.white },
  pkgPricePerView: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary },
  checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  checkText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.primary },
  pkgStats: { flexDirection: 'row', alignItems: 'center' },
  pkgStat: { flex: 1, alignItems: 'center', gap: 4 },
  pkgStatLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted },
  pkgStatValue: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.white },
  pkgDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  budgetSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.accent, gap: Spacing.sm },
  budgetTitle: { fontFamily: FontFamily.semiBold, fontSize: 17, color: Colors.white },
  budgetHint: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  budgetInput: { flex: 1, color: Colors.white, fontFamily: FontFamily.bold, fontSize: 24, paddingVertical: Spacing.md },
  budgetCurrency: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.textSecondary },
  budgetCalc: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.success },
  purchaseBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  purchaseBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  purchaseBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.primary },
});
