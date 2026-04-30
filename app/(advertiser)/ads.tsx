import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius, formatKWD } from '../../src/lib/theme';
import CommentSheet from '../../src/components/CommentSheet';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:         { label: 'Active',          color: Colors.success },
  paused:         { label: 'Paused',          color: Colors.accent },
  completed:      { label: 'Completed',       color: Colors.textMuted },
  pending_review: { label: 'Under Review',    color: Colors.accent },
};

export default function AdsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('advertiser-ads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ads' },
        () => {
          console.log('REALTIME: Ad update detected, refreshing list...');
          queryClient.invalidateQueries({ queryKey: ['my-ads'] });
          queryClient.invalidateQueries({ queryKey: ['available-pkgs'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchased_packages' },
        () => {
          console.log('REALTIME: Package update detected, refreshing list...');
          queryClient.invalidateQueries({ queryKey: ['my-ads'] });
          queryClient.invalidateQueries({ queryKey: ['available-pkgs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [commentAdId, setCommentAdId] = useState<string | null>(null);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['my-ads', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ads')
        .select(`
          id, title, video_url, status, current_views, target_views, created_at, likes_count,
          purchased_packages (
            remaining_budget, total_budget,
            advertiser_packages ( duration_seconds )
          )
        `)
        .eq('purchased_packages.advertiser_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: availablePkgs = [] } = useQuery({
    queryKey: ['available-pkgs', user?.id],
    queryFn: async () => {
      // We fetch active packages and manually filter or use a join-check
      // Since we want to ensure 1 ad per package, we check if an ad already exists for this pkg
      const { data } = await supabase
        .from('purchased_packages')
        .select(`
          id, remaining_budget, 
          advertiser_packages(duration_seconds),
          ads(id)
        `)
        .eq('advertiser_id', user!.id)
        .eq('status', 'active')
        .gt('remaining_budget', 0);
      
      // Only return packages that have NO ads linked to them
      return (data || []).filter((pkg: any) => !pkg.ads || pkg.ads.length === 0);
    },
    enabled: !!user,
  });

  const handleCreateAd = async () => {
    if (!selectedPkgId || !videoUrl || !adTitle) {
      Alert.alert('Missing Fields', 'Please fill all fields.');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from('ads').insert({
        purchased_package_id: selectedPkgId,
        video_url: videoUrl,
        title: adTitle,
        cta_url: ctaUrl || null,
        status: 'pending_review',
      });
      if (error) throw error;
      Alert.alert('Ad Created!', 'Your ad is now under review and will go live shortly.');
      setShowCreateModal(false);
      setVideoUrl('');
      setAdTitle('');
      setCtaUrl('');
      setSelectedPkgId('');
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Ads</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <LinearGradient colors={['#F5B400', '#D49E00']} style={styles.createBtnGradient}>
            <Text style={styles.createBtnText}>+ New Ad</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => {
            const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: Colors.textSecondary };
            const progress = item.target_views ? item.current_views / item.target_views : 0;
            const pkg = item.purchased_packages;
            return (
              <View style={styles.adCard}>
                <View style={styles.adCardHeader}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.adTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.adDuration}>
                      {pkg?.advertiser_packages?.duration_seconds}s · {formatKWD(pkg?.remaining_budget || 0)} remaining
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                
                {/* ── Engagement Stats Row ── */}
                <View style={styles.engagementRow}>
                  <View style={styles.engagementBadge}>
                    <Text style={styles.engagementIcon}>❤️</Text>
                    <Text style={styles.engagementText}>{item.likes_count || 0}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.engagementBadge} 
                    onPress={() => setCommentAdId(item.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.engagementText}>View Comments</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.adStats}>
                  <Text style={styles.adStatText}>{item.current_views?.toLocaleString() || 0} / {item.target_views?.toLocaleString() || '—'} views</Text>
                  <Text style={styles.adStatText}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={styles.emptyText}>No ads yet.</Text>
              <Text style={styles.emptySubtext}>Purchase a package and create your first ad!</Text>
            </View>
          }
        />
      )}

      {/* Create Ad Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Ad</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Select Package</Text>
          {availablePkgs.length === 0 ? (
            <Text style={styles.noPkgText}>No active packages. Purchase a package first.</Text>
          ) : (
            availablePkgs.map((pkg: any) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.pkgOption, selectedPkgId === pkg.id && styles.pkgOptionSelected]}
                onPress={() => setSelectedPkgId(pkg.id)}
              >
                <Text style={styles.pkgOptionText}>
                  {pkg.advertiser_packages?.duration_seconds}s · {formatKWD(pkg.remaining_budget)} remaining
                </Text>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.fieldLabel}>Ad Title</Text>
          <TextInput
            style={styles.modalInput}
            value={adTitle}
            onChangeText={setAdTitle}
            placeholder="Enter ad title"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Video URL</Text>
          <TextInput
            style={styles.modalInput}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>CTA Button Link (Optional)</Text>
          <TextInput
            style={styles.modalInput}
            value={ctaUrl}
            onChangeText={setCtaUrl}
            placeholder="https://your-website.com"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.createAdBtn} onPress={handleCreateAd} disabled={creating}>
            <LinearGradient colors={['#F5B400', '#D49E00']} style={styles.createAdBtnGradient}>
              {creating ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.createAdBtnText}>Submit Ad for Review</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Render the Comment Sheet over the entire screen */}
      <CommentSheet
        adId={commentAdId}
        onClose={() => setCommentAdId(null)}
        isReadOnly={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white },
  createBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  createBtnGradient: { paddingHorizontal: Spacing.md, paddingVertical: 10 },
  createBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.primary },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm },
  adCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  engagementBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  engagementIcon: { fontSize: 14 },
  engagementText: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.textSecondary },

  adCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  adTitle: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.white },
  adDuration: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontFamily: FontFamily.semiBold, fontSize: 11 },
  adStats: { flexDirection: 'row', justifyContent: 'space-between' },
  adStatText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textSecondary },
  progressTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  empty: { paddingTop: 80, alignItems: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontFamily: FontFamily.semiBold, fontSize: 18, color: Colors.textSecondary },
  emptySubtext: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.white },
  modalClose: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.textSecondary },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  modalInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.white, fontFamily: FontFamily.regular, fontSize: 15 },
  pkgOption: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md },
  pkgOptionSelected: { borderColor: Colors.accent, backgroundColor: Colors.primaryLight },
  pkgOptionText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.white },
  noPkgText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textMuted },
  createAdBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  createAdBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  createAdBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.primary },
});
