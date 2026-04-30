import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Colors, FontFamily, Spacing, BorderRadius } from '../lib/theme';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  username: string;
}

interface CommentSheetProps {
  adId: string | null;
  onClose: () => void;
  isReadOnly?: boolean;
}

export default function CommentSheet({ adId, onClose, isReadOnly = false }: CommentSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%', '90%'], []);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (adId) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [adId]);

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['ad-comments', adId],
    queryFn: async () => {
      if (!adId) return [];
      const { data, error } = await supabase.rpc('rpc_get_ad_comments', { p_ad_id: adId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!adId,
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!adId || !user) throw new Error("Missing ad or user");
      const { data, error } = await supabase.rpc('rpc_post_ad_comment', {
        p_ad_id: adId,
        p_viewer_id: user.id,
        p_content: content
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['ad-comments', adId] });
    }
  });

  const handlePost = () => {
    if (!commentText.trim()) return;
    postMutation.mutate(commentText.trim());
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderComment = ({ item }: any) => (
    <View style={styles.commentRow}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{comments.length} Comments</Text>
        
        {isLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
        ) : (
          <BottomSheetFlatList
            data={comments}
            keyExtractor={(i) => i.id}
            renderItem={renderComment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
            }
          />
        )}

        {!isReadOnly && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity 
              style={[styles.postButton, !commentText.trim() && { opacity: 0.5 }]} 
              onPress={handlePost}
              disabled={!commentText.trim() || postMutation.isPending}
            >
              {postMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="send" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#12121A',
    borderRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
  },
  container: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100, // padding for input
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,180,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#F5B400',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  username: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  timestamp: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  commentText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : Spacing.md,
    backgroundColor: '#1A1A24',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    color: Colors.white,
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
  postButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    marginBottom: 2, // align with single line input
  },
});
