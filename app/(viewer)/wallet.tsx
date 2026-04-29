import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Modal, TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { callEdgeFunction } from '../../src/lib/edgeFunctions';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  reward:        { label: 'Ad Reward',       color: Colors.success, sign: '+' },
  withdrawal:    { label: 'Withdrawal',       color: Colors.error,   sign: '-' },
  ad_spend:      { label: 'Ad Spend',         color: Colors.error,   sign: '-' },
  company_share: { label: 'Platform Share',   color: Colors.accent,  sign: '+' },
  deposit:       { label: 'Deposit',          color: Colors.success, sign: '+' },
};

export default function WalletScreen() {
  const { user } = useAuthStore();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('wallets').select('id, balance').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!wallet,
  });

  const balance = wallet?.balance ?? 0;
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdrawal = () => {
    if (balance <= 0) {
      Alert.alert('No Balance', 'You have no balance available to withdraw.');
      return;
    }
    setWithdrawAmount('');
    setShowWithdrawModal(true);
  };

  const submitWithdrawal = async () => {
    const amountKWD = parseFloat(withdrawAmount);
    if (isNaN(amountKWD) || amountKWD <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    const amountMicro = Math.round(amountKWD * 1_000_000);
    if (amountMicro > balance) {
      Alert.alert('Insufficient Balance', 'Amount exceeds your current balance.');
      return;
    }
    setWithdrawing(true);
    try {
      await callEdgeFunction('request_withdrawal', {
        amount_micro: amountMicro,
        bank_details: { method: 'bank_transfer', note: 'Requested via app' },
      });
      setShowWithdrawModal(false);
      Alert.alert('✅ Submitted', `Withdrawal of ${formatKWD(amountMicro)} KWD submitted for review.`);
    } catch (err: any) {
      Alert.alert('Withdrawal Failed', err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
      </View>

      {/* Balance Card */}
      <LinearGradient
        colors={[Colors.primaryLight, Colors.primary]}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.balanceGlow} />
        <Text style={styles.balanceLabel}>Available Balance</Text>
        {walletLoading ? (
          <ActivityIndicator color={Colors.accent} size="large" />
        ) : (
          <Text style={styles.balanceAmount}>{formatKWD(balance)}</Text>
        )}
        <Text style={styles.balanceMicro}>{balance.toLocaleString()} micro-units</Text>
        <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdrawal}>
          <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Transaction History</Text>

      {txLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => {
            const config = TX_TYPE_CONFIG[item.type] || { label: item.type, color: Colors.textSecondary, sign: '' };
            return (
              <View style={styles.txItem}>
                <View style={[styles.txIcon, { backgroundColor: config.color + '22' }]}>
                  <Text style={[styles.txIconText, { color: config.color }]}>
                    {item.type === 'reward' ? '▶' : item.type === 'withdrawal' ? '↑' : '₊'}
                  </Text>
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txLabel}>{config.label}</Text>
                  <Text style={styles.txDate}>
                    {new Date(item.created_at).toLocaleDateString('en-KW', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: config.color }]}>
                  {config.sign}{formatKWD(Math.abs(item.amount))}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>No transactions yet.</Text>
              <Text style={styles.emptyTxSub}>Start watching ads to earn rewards!</Text>
            </View>
          }
        />
      )}

      {/* Withdrawal Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide" onRequestClose={() => setShowWithdrawModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Withdrawal</Text>
            <Text style={styles.modalSubtitle}>Available: {formatKWD(balance)} KWD</Text>
            <TextInput
              style={styles.modalInput}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="Amount in KWD"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWithdrawModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={submitWithdrawal} disabled={withdrawing}>
                {withdrawing
                  ? <ActivityIndicator color={Colors.primary} />
                  : <Text style={styles.modalConfirmText}>Submit</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white },
  balanceCard: {
    marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.lg, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
  },
  balanceGlow: {
    position: 'absolute', top: -50, right: -50, width: 200, height: 200,
    borderRadius: 100, backgroundColor: Colors.accent + '11',
  },
  balanceLabel: { fontFamily: FontFamily.medium, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.xs },
  balanceAmount: { fontFamily: FontFamily.bold, fontSize: 36, color: Colors.white, marginBottom: 2 },
  balanceMicro: { fontFamily: FontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: Spacing.lg },
  withdrawBtn: {
    backgroundColor: Colors.accent, paddingVertical: 12, borderRadius: BorderRadius.md, alignItems: 'center',
  },
  withdrawBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.primary },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: 17, color: Colors.white, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18, fontFamily: FontFamily.bold },
  txDetails: { flex: 1, gap: 2 },
  txLabel: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.white },
  txDate: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted },
  txAmount: { fontFamily: FontFamily.bold, fontSize: 15 },
  emptyTx: { paddingTop: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyTxText: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.textSecondary },
  emptyTxSub: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md, paddingBottom: 40 },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  modalSubtitle: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary },
  modalInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.white, fontFamily: FontFamily.bold, fontSize: 24 },
  modalButtons: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  modalCancelText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: Colors.accent, alignItems: 'center' },
  modalConfirmText: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.primary },
});
