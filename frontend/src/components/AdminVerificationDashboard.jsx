// frontend/src/components/AdminVerificationDashboard.jsx
// Admin dashboard for ad verification and appeal management

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  IconButton,
  Tooltip,
  Paper,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Warning,
  History,
  Gavel,
  Visibility,
  Refresh,
  TrendingUp,
  TrendingDown,
  PendingActions,
  VerifiedUser,
  Block,
  AccessTime,
  Business,
  Person,
  VideoLibrary,
  MonetizationOn
} from '@mui/icons-material';
import api from '../api';

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`verification-tabpanel-${index}`}
      aria-labelledby={`verification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Ad Review Card component
function AdReviewCard({ ad, onApprove, onReject, onViewDetails }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  const handleApprove = () => {
    onApprove(ad.id, approveNotes.trim());
    setShowApproveDialog(false);
    setApproveNotes('');
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(ad.id, rejectionReason.trim(), adminNotes.trim());
      setShowRejectDialog(false);
      setRejectionReason('');
      setAdminNotes('');
    }
  };

  const isOverdue = ad.review_deadline && new Date(ad.review_deadline) < new Date();
  const timeUntilDeadline = ad.review_deadline 
    ? Math.max(0, Math.ceil((new Date(ad.review_deadline) - new Date()) / (1000 * 60 * 60)))
    : null;

  return (
    <Card 
      sx={{ 
        mb: 3, 
        border: isOverdue ? '2px solid #f44336' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 3,
        boxShadow: isOverdue ? '0 8px 32px rgba(244, 67, 54, 0.2)' : '0 4px 24px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isOverdue ? '0 12px 40px rgba(244, 67, 54, 0.3)' : '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              {ad.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
              {ad.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {isOverdue && (
              <Chip
                icon={<Warning />}
                label="OVERDUE"
                color="error"
                size="small"
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            )}
            <Chip
              icon={<Schedule />}
              label={timeUntilDeadline !== null ? `${timeUntilDeadline}h left` : 'No deadline'}
              color={isOverdue ? 'error' : 'default'}
              size="small"
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {ad.advertiser?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ad.advertiser?.company_name || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'secondary.main' }}>
                <VideoLibrary />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {ad.package?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ad.package?.duration || 'N/A'}s duration
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgba(25, 118, 210, 0.04)', 
          borderRadius: 2, 
          border: '1px solid rgba(25, 118, 210, 0.1)' 
        }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Submitted:</strong> {new Date(ad.submitted_for_review_at).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
        <Button
          size="medium"
          startIcon={<Visibility />}
          onClick={() => onViewDetails(ad)}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          View Details
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="medium"
            startIcon={<CheckCircle />}
            onClick={() => setShowApproveDialog(true)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="medium"
            startIcon={<Cancel />}
            onClick={() => setShowRejectDialog(true)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)'
              }
            }}
          >
            Reject
          </Button>
        </Box>
      </CardActions>

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
          Reject Ad
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason *"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a clear reason for rejection..."
            multiline
            rows={3}
            required
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="Admin Notes (Optional)"
            fullWidth
            variant="outlined"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Additional notes for internal use..."
            multiline
            rows={2}
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
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim()}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Reject Ad
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog 
        open={showApproveDialog} 
        onClose={() => setShowApproveDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Approve Ad
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            margin="dense"
            label="Admin Notes (Optional)"
            fullWidth
            variant="outlined"
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
            placeholder="Any additional notes for this approval..."
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowApproveDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Approve Ad
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// Appeal Card component
function AppealCard({ appeal, onProcessAppeal }) {
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [decision, setDecision] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  const handleProcess = () => {
    if (decision && adminResponse.trim()) {
      onProcessAppeal(appeal.id, decision, adminResponse.trim());
      setShowProcessDialog(false);
      setDecision('');
      setAdminResponse('');
    }
  };

  return (
    <Card sx={{ 
      mb: 3, 
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 3,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Appeal for: {appeal.ad?.title || 'Unknown Ad'}
          </Typography>
          <Chip
            icon={<Gavel />}
            label="APPEAL"
            color="warning"
            size="small"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          />
        </Box>

        <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          {appeal.reason}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {appeal.advertiser?.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {appeal.advertiser?.company_name || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'info.main' }}>
                <AccessTime />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {new Date(appeal.created_at).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Appeal Date
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgba(255, 152, 0, 0.04)', 
          borderRadius: 2, 
          border: '1px solid rgba(255, 152, 0, 0.1)' 
        }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Original Rejection:</strong> {appeal.ad?.rejection_reason || 'N/A'}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<Gavel />}
          onClick={() => setShowProcessDialog(true)}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Process Appeal
        </Button>
      </CardActions>

      {/* Process Appeal Dialog */}
      <Dialog 
        open={showProcessDialog} 
        onClose={() => setShowProcessDialog(false)} 
        maxWidth="sm" 
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
          Process Appeal
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
              Decision:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={decision === 'approved' ? 'contained' : 'outlined'}
                color="success"
                onClick={() => setDecision('approved')}
                size="medium"
                startIcon={<CheckCircle />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 120
                }}
              >
                Approve
              </Button>
              <Button
                variant={decision === 'rejected' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setDecision('rejected')}
                size="medium"
                startIcon={<Cancel />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 120
                }}
              >
                Reject
              </Button>
            </Box>
          </Box>
          <TextField
            margin="dense"
            label="Admin Response *"
            fullWidth
            variant="outlined"
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder="Provide your response to the advertiser..."
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowProcessDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProcess} 
            color="primary" 
            variant="contained"
            disabled={!decision || !adminResponse.trim()}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Process Appeal
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// Main Admin Verification Dashboard
export default function AdminVerificationDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [pendingAds, setPendingAds] = useState([]);
  const [pendingAppeals, setPendingAppeals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetails, setShowAdDetails] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch data based on active tab
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (tabValue === 0) {
        // Fetch pending ads
        const adsResponse = await api.get('/api/admin/ads/pending-review?status=pending');
        if (adsResponse.data.success) {
          setPendingAds(adsResponse.data.data.ads);
        }
      } else if (tabValue === 1) {
        // Fetch pending appeals
        const appealsResponse = await api.get('/api/admin/appeals');
        if (appealsResponse.data.success) {
          setPendingAppeals(appealsResponse.data.data.appeals);
        }
      }

      // Always fetch stats
      const statsResponse = await api.get('/api/admin/verification-stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle ad approval
  const handleApproveAd = async (adId, adminNotes) => {
    try {
      const response = await api.post(`/api/admin/ads/${adId}/approve`, {
        admin_notes: adminNotes
      });
      
      if (response.data.success) {
        // Remove from pending list
        setPendingAds(prev => prev.filter(ad => ad.id !== adId));
        // Refresh stats
        fetchData();
      }
    } catch (error) {
      console.error('Failed to approve ad:', error);
    }
  };

  // Handle ad rejection
  const handleRejectAd = async (adId, rejectionReason, adminNotes) => {
    try {
      const response = await api.post(`/api/admin/ads/${adId}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      });
      
      if (response.data.success) {
        // Remove from pending list
        setPendingAds(prev => prev.filter(ad => ad.id !== adId));
        // Refresh stats
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reject ad:', error);
    }
  };

  // Handle appeal processing
  const handleProcessAppeal = async (appealId, decision, adminResponse) => {
    try {
      const response = await api.post(`/api/admin/appeals/${appealId}/process`, {
        decision,
        admin_response: adminResponse
      });
      
      if (response.data.success) {
        // Remove from pending appeals
        setPendingAppeals(prev => prev.filter(appeal => appeal.id !== appealId));
        // Refresh stats
        fetchData();
      }
    } catch (error) {
      console.error('Failed to process appeal:', error);
    }
  };

  // Handle viewing ad details
  const handleViewAdDetails = (ad) => {
    setSelectedAd(ad);
    setShowAdDetails(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
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
            Ad Verification Dashboard
          </Typography>
          
          {/* Verification Status Stats */}
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
            Verification Status
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={2}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800 }}>
                  {stats.verification?.pending || stats.pending || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending Review
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                  {stats.verification?.approved || stats.approved || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Approved
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(244, 67, 54, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(244, 67, 54, 0.2)'
              }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 800 }}>
                  {stats.verification?.rejected || stats.rejected || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Rejected
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800 }}>
                  {stats.verification?.pending_appeals || stats.pending_appeals || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending Appeals
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(244, 67, 54, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(244, 67, 54, 0.2)'
              }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 800 }}>
                  {stats.verification?.overdue || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Overdue
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Ad Status Stats for Approved Ads */}
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
            Advertiser Control Status (Only for Verified Ads)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                  {stats.ad_status?.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Live & Running
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (Advertiser Active)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800 }}>
                  {stats.ad_status?.paused || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Paused
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (Advertiser Paused)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 800 }}>
                  {stats.ad_status?.draft || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Draft
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (Advertiser Draft)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Status Explanation Alerts */}
      <Box sx={{ mb: 4 }}>
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            <strong>Status System Explanation:</strong> There are two separate status systems:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            1. <strong>Verification Status:</strong> Controlled by admins (Pending → Approved/Rejected)
          </Typography>
          <Typography variant="body2">
            2. <strong>Advertiser Control Status:</strong> Controlled by advertisers after approval (Active/Paused/Draft)
          </Typography>
        </Alert>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="verification tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
                px: 4
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingActions />
                  Pending Ads
                  <Badge badgeContent={pendingAds.length} color="warning" sx={{ ml: 1 }} />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Gavel />
                  Pending Appeals
                  <Badge badgeContent={pendingAppeals.length} color="error" sx={{ ml: 1 }} />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Pending Ads Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Pending Ads ({pendingAds.length})
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={fetchData}
              disabled={loading}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : pendingAds.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No ads are currently pending review.
            </Alert>
          ) : (
            pendingAds.map((ad) => (
              <AdReviewCard
                key={ad.id}
                ad={ad}
                onApprove={handleApproveAd}
                onReject={handleRejectAd}
                onViewDetails={handleViewAdDetails}
              />
            ))
          )}
        </TabPanel>

        {/* Pending Appeals Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Pending Appeals ({pendingAppeals.length})
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={fetchData}
              disabled={loading}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : pendingAppeals.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No appeals are currently pending.
            </Alert>
          ) : (
            pendingAppeals.map((appeal) => (
              <AppealCard
                key={appeal.id}
                appeal={appeal}
                onProcessAppeal={handleProcessAppeal}
              />
            ))
          )}
        </TabPanel>
      </Paper>

      {/* Ad Details Dialog */}
      <Dialog 
        open={showAdDetails} 
        onClose={() => setShowAdDetails(false)} 
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
          Ad Details - {selectedAd?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedAd && (
            <Box>
              {/* Media Display Section */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Ad Media Preview
                </Typography>
                {selectedAd.mediaUrl ? (
                  <Box sx={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px', 
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    bgcolor: '#f5f5f5'
                  }}>
                    {selectedAd.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      // Video player
                      <video
                        controls
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          maxHeight: '400px'
                        }}
                        src={selectedAd.mediaUrl}
                        onError={(e) => {
                          console.error('Video loading error:', e);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      >
                        <source src={selectedAd.mediaUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : selectedAd.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      // Image display
                      <img
                        src={selectedAd.mediaUrl}
                        alt={selectedAd.title}
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          maxHeight: '400px',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          console.error('Image loading error:', e);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : (
                      // Fallback for unknown file types
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        color: 'text.secondary'
                      }}>
                        <Typography variant="body1" gutterBottom>
                          Media Preview Not Available
                        </Typography>
                        <Typography variant="body2">
                          This file type cannot be previewed in the browser.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    color: 'text.secondary',
                    bgcolor: '#f5f5f5',
                    borderRadius: 2
                  }}>
                    <Typography variant="body1">
                      No media available for preview.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Ad Information */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Ad Information
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(25, 118, 210, 0.04)', 
                    borderRadius: 2,
                    border: '1px solid rgba(25, 118, 210, 0.1)'
                  }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Title:</strong> {selectedAd.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Description:</strong> {selectedAd.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Package:</strong> {selectedAd.package?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Duration:</strong> {selectedAd.package?.duration || 'N/A'} seconds
                    </Typography>
                    <Typography variant="body2">
                      <strong>Budget:</strong> {selectedAd.package?.budget || 'N/A'} KWD
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    Advertiser Information
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(76, 175, 80, 0.04)', 
                    borderRadius: 2,
                    border: '1px solid rgba(76, 175, 80, 0.1)'
                  }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {selectedAd.advertiser?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Company:</strong> {selectedAd.advertiser?.company_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedAd.advertiser?.phone || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedAd.advertiser?.email || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowAdDetails(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
