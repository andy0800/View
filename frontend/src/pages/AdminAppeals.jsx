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
  CardContent
} from '@mui/material';
import {
  Gavel,
  Person,
  Business,
  CheckCircle,
  Cancel,
  Visibility,
  Schedule,
  Warning,
  TrendingUp,
  VideoLibrary,
  Message
} from '@mui/icons-material';
import api from '../api';

export default function AdminAppeals() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decision, setDecision] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get('/api/admin/appeals');
      
      if (res.data.success) {
        setAppeals(res.data.data.appeals);
        setStats(res.data.data.stats);
        setPagination(res.data.data.pagination);
      } else {
        setError('Failed to fetch appeals');
      }
    } catch (error) {
      // Error handled in UI
      setError('Failed to fetch appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealDecision = (appeal, decisionType) => {
    setSelectedAppeal(appeal);
    setDecision(decisionType);
    setAdminResponse('');
    setShowDecisionDialog(true);
  };

  const confirmDecision = async () => {
    if (!adminResponse.trim()) {
      setError('Please provide an admin response');
      return;
    }

    try {
      setProcessingId(selectedAppeal.id);
      
      await api.post(`/api/admin/appeals/${selectedAppeal.id}/process`, {
        decision,
        admin_response: adminResponse.trim()
      });

      // Refresh appeals list
      await fetchAppeals();
      
      setShowDecisionDialog(false);
      setSelectedAppeal(null);
      setDecision('');
      setAdminResponse('');
      
      // Show success message
      setSuccessMessage(`Appeal ${decision} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error processing appeal
      setError('Failed to process appeal');
    } finally {
      setProcessingId(null);
    }
  };

  const getAppealStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAppealStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Schedule />;
      case 'approved':
        return <CheckCircle />;
      case 'rejected':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'advertiser':
        return <Business />;
      case 'viewer':
        return <Person />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'advertiser':
        return 'primary';
      case 'viewer':
        return 'success';
      default:
        return 'default';
    }
  };

  const isOverdue = (createdAt) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(createdAt) < sevenDaysAgo;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2, m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Display success message if exists
  const successAlert = successMessage ? (
    <Alert severity="success" sx={{ borderRadius: 2, m: 2, mb: 2 }}>
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
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.03) 0%, rgba(156, 39, 176, 0.03) 100%)', 
          zIndex: 0 
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
            Appeal Management Dashboard
          </Typography>
          
          {/* Appeal Stats */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800 }}>
                  {stats.total_pending || appeals.length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Pending Appeals
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
                  {stats.overdue_count || appeals.filter(a => isOverdue(a.created_at)).length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Overdue Appeals
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
                  {appeals.filter(a => a.status === 'approved').length}
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
                bgcolor: 'rgba(244, 67, 54, 0.1)', 
                borderRadius: 3,
                border: '1px solid rgba(244, 67, 54, 0.2)'
              }}>
                <Typography variant="h3" color="error.main" sx={{ fontWeight: 800 }}>
                  {appeals.filter(a => a.status === 'rejected').length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Rejected
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Appeals Table */}
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
            Pending Appeals ({appeals.filter(a => a.status === 'pending').length})
          </Typography>
        </Box>

        {appeals.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
              <Gavel sx={{ fontSize: 40, color: 'success.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Appeals Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are currently no appeals to review.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Appeal</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Advertiser</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Ad Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appeals.map((appeal) => (
                  <TableRow 
                    key={appeal.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(25, 118, 210, 0.02)',
                        transition: 'background-color 0.2s ease'
                      },
                      ...(isOverdue(appeal.created_at) && {
                        bgcolor: 'rgba(255, 152, 0, 0.05)',
                        borderLeft: '4px solid #ff9800'
                      })
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2, 
                            bgcolor: 'secondary.main'
                          }}
                        >
                          <Gavel />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Appeal #{appeal.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appeal.ad?.title || 'Ad Title N/A'}
                          </Typography>
                          {isOverdue(appeal.created_at) && (
                            <Chip
                              icon={<Warning />}
                              label="OVERDUE"
                              color="warning"
                              size="small"
                              sx={{ mt: 0.5, fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 2, 
                            bgcolor: getRoleColor(appeal.advertiser?.role) === 'primary' ? 'primary.main' : 'success.main'
                          }}
                        >
                          {getRoleIcon(appeal.advertiser?.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {appeal.advertiser?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appeal.advertiser?.phone || 'No Phone'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {appeal.ad?.section || 'No Section'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Rejection: {appeal.ad?.rejection_reason || 'No reason provided'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getAppealStatusIcon(appeal.status)}
                        label={appeal.status || 'Unknown'}
                        color={getAppealStatusColor(appeal.status)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: 2,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {appeal.created_at ? new Date(appeal.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appeal.created_at ? new Date(appeal.created_at).toLocaleTimeString() : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setSelectedAppeal(appeal);
                              setShowDetailsDialog(true);
                            }}
                            sx={{ 
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {appeal.status === 'pending' && (
                          <>
                            <Tooltip title="Approve Appeal">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleAppealDecision(appeal, 'approved')}
                                disabled={processingId === appeal.id}
                                sx={{ 
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Appeal">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleAppealDecision(appeal, 'rejected')}
                                disabled={processingId === appeal.id}
                                sx={{ 
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                  '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' }
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
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

      {/* Appeal Details Dialog */}
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
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Appeal Details - #{selectedAppeal?.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedAppeal && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Appeal Information
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(156, 39, 176, 0.04)', 
                  borderRadius: 2,
                  border: '1px solid rgba(156, 39, 176, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Appeal ID:</strong> #{selectedAppeal.id}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong> 
                    <Chip 
                      label={selectedAppeal.status || 'Unknown'} 
                      color={getAppealStatusColor(selectedAppeal.status)} 
                      size="small" 
                      sx={{ ml: 1, borderRadius: 2 }}
                    />
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Submitted:</strong> {selectedAppeal.created_at ? new Date(selectedAppeal.created_at).toLocaleString() : 'Unknown'}
                  </Typography>
                  {selectedAppeal.reviewed_at && (
                    <Typography variant="body2">
                      <strong>Reviewed:</strong> {new Date(selectedAppeal.reviewed_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Grid>
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
                    <strong>Title:</strong> {selectedAppeal.ad?.title || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Section:</strong> {selectedAppeal.ad?.section || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Rejection Reason:</strong> {selectedAppeal.ad?.rejection_reason || 'No reason provided'}
                  </Typography>
                  {selectedAppeal.ad?.mediaUrl && (
                    <Button
                      size="small"
                      startIcon={<VideoLibrary />}
                      onClick={() => window.open(selectedAppeal.ad.mediaUrl, '_blank')}
                      sx={{ mt: 1 }}
                    >
                      View Ad Media
                    </Button>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
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
                    <strong>Name:</strong> {selectedAppeal.advertiser?.name || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> {selectedAppeal.advertiser?.phone || 'Not provided'}
                  </Typography>
                  {selectedAppeal.advertiser?.company_name && (
                    <Typography variant="body2">
                      <strong>Company:</strong> {selectedAppeal.advertiser.company_name}
                    </Typography>
                  )}
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

      {/* Decision Dialog */}
      <Dialog 
        open={showDecisionDialog} 
        onClose={() => setShowDecisionDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: decision === 'approved' 
            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          {decision === 'approved' ? 'Approve' : 'Reject'} Appeal
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to <strong>{decision}</strong> the appeal for ad <strong>"{selectedAppeal?.ad?.title}"</strong>?
          </Typography>
          <TextField
            margin="dense"
            label="Admin Response *"
            fullWidth
            variant="outlined"
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder={`Please provide your response for ${decision === 'approved' ? 'approval' : 'rejection'}...`}
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowDecisionDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDecision} 
            color={decision === 'approved' ? 'success' : 'error'} 
            variant="contained"
            disabled={!adminResponse.trim() || processingId === selectedAppeal?.id}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {processingId === selectedAppeal?.id ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `${decision === 'approved' ? 'Approve' : 'Reject'} Appeal`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
