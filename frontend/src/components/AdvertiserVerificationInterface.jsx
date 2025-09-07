// frontend/src/components/AdvertiserVerificationInterface.jsx
// Advertiser interface for managing ad verification status and appeals

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Warning,
  History,
  Gavel,
  Send,
  ExpandMore,
  Info,
  Error,
  Help
} from '@mui/icons-material';
import { api } from '../api';

// Verification Status Badge component
function VerificationStatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'warning', icon: <Schedule />, label: 'Under Review' };
      case 'approved':
        return { color: 'success', icon: <CheckCircle />, label: 'Approved' };
      case 'rejected':
        return { color: 'error', icon: <Cancel />, label: 'Rejected' };
      case 'under_appeal':
        return { color: 'info', icon: <Gavel />, label: 'Appeal Submitted' };
      default:
        return { color: 'default', icon: <Info />, label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 'bold' }}
    />
  );
}

// Ad Verification Card component
function AdVerificationCard({ ad, onRefresh }) {
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/api/ads/${ad.id}/appeal`, {
        appeal_reason: appealReason.trim(),
        appeal_evidence: appealEvidence.trim() || null
      });

      if (response.data.success) {
        setShowAppealDialog(false);
        setAppealReason('');
        setAppealEvidence('');
        onRefresh(); // Refresh the data
      }
    } catch (error) {
      console.error('Failed to submit appeal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitAppeal = ad.verification_status === 'rejected';
  const canSubmitForReview = ad.verification_status === 'pending' && !ad.submitted_for_review_at;

  return (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div">
            {ad.title}
          </Typography>
          <VerificationStatusBadge status={ad.verification_status} />
        </Box>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {ad.description}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Section:</strong> {ad.section}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Budget:</strong> {ad.budget} KWD
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> {ad.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Active:</strong> {ad.is_active ? 'Yes' : 'No'}
            </Typography>
          </Grid>
        </Grid>

        {/* Verification Details */}
        {ad.submitted_for_review_at && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Review Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Submitted for review:</strong> {new Date(ad.submitted_for_review_at).toLocaleString()}
            </Typography>
            {ad.review_deadline && (
              <Typography variant="body2" color="text.secondary">
                <strong>Review deadline:</strong> {new Date(ad.review_deadline).toLocaleString()}
              </Typography>
            )}
          </Box>
        )}

        {/* Rejection Details */}
        {ad.verification_status === 'rejected' && ad.rejection_reason && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rejection Reason:
            </Typography>
            <Typography variant="body2">
              {ad.rejection_reason}
            </Typography>
          </Alert>
        )}

        {/* Admin Notes */}
        {ad.admin_notes && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Admin Notes:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ad.admin_notes}
            </Typography>
          </Box>
        )}

        {/* Verification Date */}
        {ad.verified_at && (
          <Typography variant="body2" color="text.secondary">
            <strong>Verified:</strong> {new Date(ad.verified_at).toLocaleString()}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          {canSubmitForReview && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Send />}
              onClick={async () => {
                try {
                  const response = await api.post(`/api/ads/${ad.id}/submit-for-review`);
                  if (response.data.success) {
                    onRefresh(); // Refresh the data
                  }
                } catch (error) {
                  console.error('Failed to submit for review:', error);
                }
              }}
            >
              Submit for Review
            </Button>
          )}
        </Box>
        <Box>
          {canSubmitAppeal && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Gavel />}
              onClick={() => setShowAppealDialog(true)}
            >
              Submit Appeal
            </Button>
          )}
        </Box>
      </CardActions>

      {/* Appeal Dialog */}
      <Dialog open={showAppealDialog} onClose={() => setShowAppealDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Appeal</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please provide a clear reason for your appeal. This will be reviewed by our admin team.
          </Alert>
          
          <TextField
            autoFocus
            margin="dense"
            label="Appeal Reason *"
            fullWidth
            variant="outlined"
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Please explain why you believe this ad should be approved..."
            multiline
            rows={4}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Supporting Evidence (Optional)"
            fullWidth
            variant="outlined"
            value={appealEvidence}
            onChange={(e) => setAppealEvidence(e.target.value)}
            placeholder="Any additional information or evidence that supports your appeal..."
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAppealDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitAppeal} 
            color="primary" 
            variant="contained"
            disabled={!appealReason.trim() || submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// Verification History component
function VerificationHistory({ adId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/ads/${adId}/verification-status`);
        if (response.data.success) {
          setHistory(response.data.data.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch verification history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (adId) {
      fetchHistory();
    }
  }, [adId]);

  if (loading) {
    return <CircularProgress size={20} />;
  }

  if (history.length === 0) {
    return <Typography color="text.secondary">No verification history available.</Typography>;
  }

  return (
    <List dense>
      {history.map((item, index) => (
        <ListItem key={index} sx={{ px: 0 }}>
          <ListItemIcon>
            {item.action === 'approved' && <CheckCircle color="success" />}
            {item.action === 'rejected' && <Cancel color="error" />}
            {item.action === 'submitted' && <Send color="primary" />}
            {item.action === 'appeal_submitted' && <Gavel color="info" />}
            {item.action === 'appeal_approved' && <CheckCircle color="success" />}
            {item.action === 'appeal_rejected' && <Cancel color="error" />}
          </ListItemIcon>
          <ListItemText
            primary={item.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(item.created_at).toLocaleString()}
                </Typography>
                {item.notes && (
                  <Typography variant="body2" color="text.secondary">
                    {item.notes}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

// Main Advertiser Verification Interface
export default function AdvertiserVerificationInterface() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ads/advertiser/ads');
      if (response.data.success) {
        setAds(response.data.data.ads);
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const getVerificationStats = () => {
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      under_appeal: 0,
      total: ads.length
    };

    ads.forEach(ad => {
      if (stats.hasOwnProperty(ad.verification_status)) {
        stats[ad.verification_status]++;
      }
    });

    return stats;
  };

  const stats = getVerificationStats();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with stats */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h4" gutterBottom>
          Ad Verification Status
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main">
                {stats.under_appeal}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under Appeal
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Information Alert */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>How it works:</strong> After creating an ad, you must submit it for review. 
          Our admin team will review your ad within 24 hours. If rejected, you can submit an appeal 
          with additional information.
        </Typography>
      </Alert>

      {/* Ads List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : ads.length === 0 ? (
        <Alert severity="info">
          You haven't created any ads yet. Create an ad to get started with the verification process.
        </Alert>
      ) : (
        ads.map((ad) => (
          <AdVerificationCard
            key={ad.id}
            ad={ad}
            onRefresh={fetchAds}
          />
        ))
      )}

      {/* Verification History Dialog */}
      <Dialog 
        open={showHistory} 
        onClose={() => setShowHistory(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Verification History</DialogTitle>
        <DialogContent>
          {selectedAd && <VerificationHistory adId={selectedAd.id} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
