import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  VideoLibrary,
  Person,
  Business,
  CheckCircle,
  Cancel,
  Pause,
  PlayArrow,
  Visibility,
  Edit,
  Delete,
  MonetizationOn,
  TrendingUp,
  Schedule,
  VerifiedUser,
  PendingActions,
  Block,
  PlayCircleOutline,
  PauseCircleOutline
} from '@mui/icons-material';
import api from '../api';
import { formatKWD, filsToKwd } from '../utils/currencyUtils';

export default function AdminVideos() {
  const [vds, setVds] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoad] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = () => {
    setLoad(true);
    api.get('/api/admin/videos')
      .then(res => {
        if (res.data.success) {
          // New API response format
          setVds(res.data.data.ads);
        } else {
          // Legacy API response format
          setVds(res.data);
        }
      })
      .catch(() => setErr(t('errors.failedToLoadVideos')))
      .finally(() => setLoad(false));
  };

  const handleApprove = async (adId) => {
    setProcessing(prev => ({ ...prev, [adId]: true }));
    try {
      await api.post(`/api/admin/ads/${adId}/approve`);
      fetchVideos(); // Refresh the list
      setSuccessMessage('Ad approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000); // Auto-hide after 3 seconds
    } catch (error) {
      setErr('Failed to approve ad: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(prev => ({ ...prev, [adId]: false }));
    }
  };

  const handleReject = async (adId) => {
    // This function is now handled by the rejection dialog
    // The actual rejection logic is in confirmRejection function

    setProcessing(prev => ({ ...prev, [adId]: true }));
    try {
      await api.post(`/api/admin/ads/${adId}/reject`, {
        rejection_reason: rejectionReason.trim()
      });
      fetchVideos(); // Refresh the list
      setSuccessMessage('Ad rejected successfully!');
      setTimeout(() => setSuccessMessage(''), 3000); // Auto-hide after 3 seconds
    } catch (error) {
      setErr('Failed to reject ad: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(prev => ({ ...prev, [adId]: false }));
    }
  };

  const handleStatusChange = async (adId, newStatus) => {
    setProcessing(prev => ({ ...prev, [adId]: true }));
    try {
      await api.put(`/api/admin/ads/${adId}/status`, {
        status: newStatus,
        admin_notes: `Status changed to ${newStatus} by admin`
      });
      fetchVideos(); // Refresh the list
      setSuccessMessage(`Ad status changed to ${newStatus} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000); // Auto-hide after 3 seconds
    } catch (error) {
      setErr('Failed to change ad status: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(prev => ({ ...prev, [adId]: false }));
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getAdStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'draft': return 'default';
      case 'completed': return 'info';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getVerificationStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <VerifiedUser />;
      case 'pending': return <PendingActions />;
      case 'rejected': return <Block />;
      default: return <Schedule />;
    }
  };

  const getAdStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayCircleOutline />;
      case 'paused': return <PauseCircleOutline />;
      case 'draft': return <Edit />;
      case 'completed': return <CheckCircle />;
      case 'expired': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const handleViewDetails = (video) => {
    setSelectedVideo(video);
    setShowDetailsDialog(true);
  };

  const handleRejectWithDialog = (video) => {
    setSelectedVideo(video);
    setShowRejectDialog(true);
  };

  const confirmRejection = async () => {
    if (rejectionReason.trim()) {
      await handleReject(selectedVideo.id);
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedVideo(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (err) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {err}
      </Alert>
    );
  }

  // Display success message if exists
  const successAlert = successMessage ? (
    <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
      {successMessage}
    </Alert>
  ) : null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Success Message */}
      {successAlert}
      
      {/* Header with stats */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Background */}
        <Box sx={{ 
          position: 'absolute', 
          top: -50, 
          right: -50, 
          width: 200, 
          height: 200, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(57, 73, 171, 0.03) 100%)', 
          zIndex: 0 
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
            Video Management Dashboard
          </Typography>
          
          {/* Video Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(25, 118, 210, 0.2)'
              }}>
                <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800 }}>
                  {vds.length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Videos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h3" color="warning.main" sx={{ fontWeight: 800 }}>
                  {vds.filter(v => v.verification_status === 'pending').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending Review
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="h3" color="success.main" sx={{ fontWeight: 800 }}>
                  {vds.filter(v => v.verification_status === 'approved').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Approved
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800 }}>
                  {vds.filter(v => v.status === 'active' && v.verification_status === 'approved').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Live & Running
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Videos Table */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            All Videos ({vds.length})
          </Typography>
        </Box>

        {vds.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'rgba(25, 118, 210, 0.1)' }}>
              <VideoLibrary sx={{ fontSize: 40, color: 'primary.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Videos Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are currently no videos in the system.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Video</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Advertiser</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Section</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Verification</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Performance</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Budget</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vds.map((video) => (
                  <TableRow 
                    key={video.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(25, 118, 210, 0.02)',
                        transition: 'background-color 0.2s ease'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2, 
                            bgcolor: 'primary.main'
                          }}
                        >
                          <VideoLibrary />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {video.title || 'No Title'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {video.description || 'No Description'}
                          </Typography>
                          {video.mediaUrl && (
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => window.open(video.mediaUrl, '_blank')}
                              sx={{ 
                                mt: 0.5, 
                                p: 0.5, 
                                minWidth: 'auto',
                                fontSize: '0.75rem',
                                textTransform: 'none'
                              }}
                            >
                              View Media
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {video.advertiser?.name || 'N/A'}
                        </Typography>
                        {video.advertiser?.company_name && (
                          <Typography variant="caption" color="text.secondary">
                            {video.advertiser.company_name}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={video.section || 'N/A'}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ textAlign: 'center' }}>
                        <Chip
                          icon={getAdStatusIcon(video.status)}
                          label={video.status || 'N/A'}
                          color={getAdStatusColor(video.status)}
                          size="small"
                          sx={{ 
                            fontWeight: 600, 
                            borderRadius: 2,
                            mb: 1,
                            textTransform: 'capitalize'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {video.is_active ? '● Live' : '○ Paused'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getVerificationStatusIcon(video.verification_status)}
                        label={video.verification_status || 'N/A'}
                        color={getVerificationStatusColor(video.verification_status)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {video.statistics?.totalViews || video.views || 0} views
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Unique: {video.statistics?.uniqueViewers || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {formatKWD(filsToKwd(video.budget))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Spent: {(() => {
                            try {
                              const spent = Number(video.spent || 0);
                              if (!isNaN(spent)) {
                                return `${(spent / 1000).toFixed(2)} KWD`;
                              }
                              return '0.00 KWD';
                            } catch (error) {
                              // Handle formatting error silently
                              return '0.00 KWD';
                            }
                          })()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDetails(video)}
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {video.verification_status === 'pending' ? (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApprove(video.id)}
                                disabled={processing[video.id]}
                                sx={{ 
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                }}
                              >
                                {processing[video.id] ? <CircularProgress size={16} /> : <CheckCircle fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleRejectWithDialog(video)}
                                disabled={processing[video.id]}
                                sx={{ 
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                                }}
                              >
                                {processing[video.id] ? <CircularProgress size={16} /> : <Cancel fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : video.verification_status === 'approved' ? (
                          <>
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              ✓ Verified
                            </Typography>
                            {video.status === 'active' ? (
                              <Tooltip title="Pause">
                                <IconButton 
                                  size="small" 
                                  color="warning"
                                  onClick={() => handleStatusChange(video.id, 'paused')}
                                  disabled={processing[video.id]}
                                  sx={{ 
                                    bgcolor: 'rgba(255, 152, 0, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.2)' }
                                  }}
                                >
                                  {processing[video.id] ? <CircularProgress size={16} /> : <Pause fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Activate">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleStatusChange(video.id, 'active')}
                                  disabled={processing[video.id]}
                                  sx={{ 
                                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                  }}
                                >
                                  {processing[video.id] ? <CircularProgress size={16} /> : <PlayArrow fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {video.verification_status === 'rejected' ? 'Rejected' : 'No action needed'}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Video Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Video Details - {selectedVideo?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedVideo && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Video Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Title:</strong> {selectedVideo.title || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Description:</strong> {selectedVideo.description || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Section:</strong> {selectedVideo.section || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {selectedVideo.created_at ? new Date(selectedVideo.created_at).toLocaleString() : 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Performance & Budget
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(76, 175, 80, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(76, 175, 80, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Total Views:</strong> {selectedVideo.statistics?.totalViews || selectedVideo.views || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Unique Viewers:</strong> {selectedVideo.statistics?.uniqueViewers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Budget:</strong> {formatKWD(filsToKwd(selectedVideo.budget))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Spent:</strong> {(() => {
                      try {
                        const spent = Number(selectedVideo.spent || 0);
                        if (!isNaN(spent)) {
                          return `${(spent / 1000).toFixed(2)} KWD`;
                        }
                        return '0.00 KWD';
                      } catch (error) {
                        // Handle formatting error silently
                        return '0.00 KWD';
                      }
                    })()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowDetailsDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={showRejectDialog} 
        onClose={() => setShowRejectDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Reject Video
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reject the video <strong>{selectedVideo?.title}</strong>?
          </Typography>
          <TextField
            margin="dense"
            label="Rejection Reason *"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowRejectDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRejection} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim()}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Reject Video
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}