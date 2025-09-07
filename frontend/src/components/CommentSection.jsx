// frontend/src/components/CommentSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send,
  Favorite,
  FavoriteBorder,
  Reply,
  MoreVert,
  Close
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { validateAuth } from '../utils/authUtils';

export default function CommentSection({ adId, isOpen, onClose, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  const { user } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const commentInputRef = useRef(null);

  // Fetch comments when component mounts or adId changes
  useEffect(() => {
    if (isOpen && adId) {
      // Don't validate auth here - let the API handle it gracefully
      // This prevents blocking comment access due to auth validation
      fetchComments();
    }
  }, [isOpen, adId]);

  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/api/comments/ad/${adId}`, {
        params: { page: pageNum, limit: 20 }
      });

      if (response.data.success) {
        const newComments = response.data.data.comments;
        
        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }
        
        setHasMore(response.data.data.pagination.has_next);
        setPage(pageNum);
        
        // Update comment count in parent component
        if (onCommentCountChange) {
          onCommentCountChange(response.data.data.pagination.total_comments);
        }
        
        // Log successful comment fetch for debugging
        console.log(`📝 Fetched ${newComments.length} comments for ad ${adId}`);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      // Handle different error types gracefully
      if (error.response?.status === 401) {
        setError('Please log in to view comments.');
        // Don't automatically redirect - let user decide what to do
        // This prevents infinite loops
        return;
      }
      
      if (error.response?.status === 403) {
        setError('You do not have permission to view comments.');
        return;
      }
      
      if (error.response?.status === 404) {
        setError('Comments not found for this video.');
        return;
      }
      
      if (error.response?.status === 500) {
        setError('Comment system temporarily unavailable. Please try again later.');
        return;
      }
      
      // Default error message
      setError(t('comments.errorFetching'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      setError('');

      const response = await api.post('/api/comments', {
        ad_id: adId,
        content: newComment.trim(),
        parent_id: replyTo?.id || null
      });

      if (response.data.success) {
        const comment = response.data.data;
        
        if (replyTo) {
          // Add reply to parent comment
          setComments(prev => prev.map(c => 
            c.id === replyTo.id 
              ? { ...c, replies_count: c.replies_count + 1 }
              : c
          ));
          setReplyTo(null);
          setReplyContent('');
        } else {
          // Add new top-level comment
          setComments(prev => [comment, ...prev]);
        }
        
        setNewComment('');
        
        // Update comment count
        if (onCommentCountChange) {
          onCommentCountChange(prev => prev + 1);
        }
        
        // Log successful comment creation for debugging
        console.log(`💬 Comment created successfully for ad ${adId}`);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      setError(t('comments.errorCreating'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/like`);
      
      if (response.data.success) {
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { 
                ...c, 
                likes_count: response.data.data.likes_count,
                isLiked: response.data.data.liked 
              }
            : c
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setReplyContent('');
    commentInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
    setReplyContent('');
  };

  const loadMoreComments = () => {
    if (hasMore && !loading) {
      fetchComments(page + 1, true);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return t('comments.justNow');
    if (diffInSeconds < 3600) return t('comments.minutesAgo', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('comments.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 2592000) return t('comments.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          cursor: 'pointer'
        }}
      />
      
      {/* Comment Section */}
      <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? '100%' : '600px', // Fixed width on PC, full width on mobile
        maxWidth: '90vw', // Ensure it doesn't exceed viewport width
        height: isMobile ? '70vh' : '500px', // Fixed height on PC, viewport height on mobile
        maxHeight: '80vh', // Maximum height constraint
        backgroundColor: 'background.paper',
        borderTop: `2px solid ${theme.palette.primary.main}`,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden' // Prevent content from spilling out
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {t('comments.title')} ({comments.length})
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Comment Input */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        {replyTo && (
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {t('comments.replyingTo')} {replyTo.user?.name || t('comments.anonymous')}
            </Typography>
            <Button size="small" onClick={cancelReply}>
              {t('comments.cancel')}
            </Button>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            ref={commentInputRef}
            fullWidth
            size="small"
            placeholder={replyTo ? t('comments.writeReply') : t('comments.writeComment')}
            value={replyTo ? replyContent : newComment}
            onChange={(e) => replyTo ? setReplyContent(e.target.value) : setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (replyTo) {
                  handleSubmitComment();
                } else {
                  handleSubmitComment();
                }
              }
            }}
            multiline
            maxRows={3}
            disabled={submitting}
          />
          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={submitting || (!newComment.trim() && !replyContent.trim())}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {submitting ? <CircularProgress size={20 } /> : <Send />}
          </Button>
        </Box>
        
        {/* Authentication Notice */}
        {!user && (
          <Box sx={{ mt: 1, p: 1, backgroundColor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="caption" color="warning.contrastText">
              Please log in to add comments
            </Typography>
          </Box>
        )}
      </Box>

      {/* Comments List */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        minHeight: 0, // Ensure proper flex behavior
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.5)'
          }
        }
      }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && comments.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="textSecondary">
              {t('comments.noCommentsYet')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{ 
                        width: 32, 
                        height: 32,
                        backgroundColor: theme.palette.primary.main,
                        fontSize: '0.875rem'
                      }}
                    >
                      {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {comment.user?.name || t('comments.anonymous')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimeAgo(comment.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {comment.content}
                      </Typography>
                    }
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleLike(comment.id)}
                      sx={{ color: comment.isLiked ? 'error.main' : 'text.secondary' }}
                    >
                      {comment.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                    </IconButton>
                    
                    <Typography variant="caption" color="textSecondary">
                      {comment.likes_count}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => handleReply(comment)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Reply fontSize="small" />
                    </IconButton>

                    {comment.replies_count > 0 && (
                      <Chip
                        label={`${comment.replies_count} ${t('comments.replies')}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </ListItem>
                
                {index < comments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Load More Button */}
        {hasMore && (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Button
              variant="outlined"
              onClick={loadMoreComments}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={20} /> : t('comments.loadMore')}
            </Button>
          </Box>
        )}
      </Box>
      </Box>
    </>
  );
}
