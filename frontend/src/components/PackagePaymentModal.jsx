import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress, Box,
  Typography, Stepper, Step, StepLabel, Card, CardContent,
  InputAdornment, Chip, Divider, Grid
} from '@mui/material';
import { 
  CreditCard, CheckCircle, Error, Payment, 
  AccountBalance, Person, Email, Phone,
  TrendingUp, Warning, ShoppingCart, Timer
} from '@mui/icons-material';
import paymentService from '../services/paymentService';
import { useTranslation } from 'react-i18next';
import { formatKWD } from '../utils/currencyUtils';

const steps = ['Package Details', 'Customer Information', 'Payment Processing', 'Payment Complete'];

export default function PackagePaymentModal({ open, onClose, onSuccess, packageData, budget }) {
  console.log('🔍 PackagePaymentModal render - open:', open, 'packageData:', packageData, 'budget:', budget);
  
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerMobile: ''
  });
  
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Reset form when modal opens
  useEffect(() => {
    console.log('🔍 PackagePaymentModal useEffect - open changed:', open);
    if (open) {
      setActiveStep(0);
      setError('');
      setSuccess('');
      setFormErrors({});
      setPaymentSession(null);
      setPaymentStatus('pending');
      setFormData({
        customerName: '',
        customerEmail: '',
        customerMobile: ''
      });
    }
  }, [open]);

  const handleInputChange = useCallback((field) => (event) => {
    const value = event.target.value;
    
    // Format mobile number
    if (field === 'customerMobile') {
      const formatted = paymentService.formatMobileNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear field error when user starts typing
    setFormErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const validateForm = useCallback(() => {
    const validation = paymentService.validatePaymentForm({
      ...formData,
      amount: budget
    });
    setFormErrors(validation.errors);
    return validation.isValid;
  }, [formData, budget]);

  const handlePaymentProcessing = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      
      // Simulate payment for testing
      if (process.env.NODE_ENV === 'development' || import.meta.env.VITE_PAYMENT_SIMULATION === 'true') {
        await paymentService.simulatePayment(sessionId, budget);
      }
      
      // Verify payment status
      const verification = await paymentService.verifyPaymentStatus(sessionId);
      
      if (verification.status === 'completed') {
        setPaymentStatus('success');
        setSuccess(`Package purchase of ${budget} KWD completed successfully!`);
        setActiveStep(3);
        onSuccess && onSuccess(verification);
      } else {
        setPaymentStatus('failed');
        setError('Payment failed. Please try again.');
        setActiveStep(0);
      }

    } catch (err) {
      setPaymentStatus('failed');
      setError('Payment verification failed');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  }, [budget, onSuccess]);

  const handleCreatePayment = useCallback(async () => {
    console.log('🔍 handleCreatePayment called with budget:', budget);
    console.log('🔍 Package data:', packageData);
    
    // Validate budget
    if (!budget || budget < 300) {
      setError('Budget must be at least 300 KWD');
      return;
    }
    
    const validation = paymentService.validatePaymentForm({
      ...formData,
      amount: budget
    });
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setError('Please fix the form errors before proceeding');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const session = await paymentService.createPackagePaymentSession({
        packageId: packageData.id,
        budget: budget,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerMobile: formData.customerMobile.trim()
      });

      setPaymentSession(session);
      setActiveStep(2);
      
      // Simulate payment processing - use inline function to avoid circular dependency
      setTimeout(async () => {
        try {
          setLoading(true);
          
          // Simulate payment for testing
          if (process.env.NODE_ENV === 'development' || import.meta.env.VITE_PAYMENT_SIMULATION === 'true') {
            await paymentService.simulatePayment(session.sessionId, budget);
          }
          
          // Verify payment status
          const verification = await paymentService.verifyPaymentStatus(session.sessionId);
          
          if (verification.status === 'completed') {
            setPaymentStatus('success');
            setSuccess(`Package purchase of ${budget} KWD completed successfully!`);
            setActiveStep(3);
            onSuccess && onSuccess(verification);
          } else {
            setPaymentStatus('failed');
            setError('Payment failed. Please try again.');
            setActiveStep(0);
          }

        } catch (err) {
          setPaymentStatus('failed');
          setError('Payment verification failed');
          setActiveStep(0);
        } finally {
          setLoading(false);
        }
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment session');
    } finally {
      setLoading(false);
    }
  }, [packageData, budget, formData, onSuccess]);

  const handleClose = useCallback(() => {
    if (paymentStatus === 'success') {
      onSuccess && onSuccess();
    }
    onClose();
  }, [paymentStatus, onSuccess, onClose]);

  // Check for missing packageData after all hooks are defined
  if (!packageData) {
    console.log('🔍 PackagePaymentModal - No packageData, showing error state');
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingCart color="primary" />
            <Typography variant="h6">Package Purchase</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Package Selected
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Please select a package before proceeding with payment.
            </Typography>
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  console.log('🔍 PackagePaymentModal - Rendering main modal content');

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            {/* Package Summary */}
            <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart />
                  Package Purchase Summary
                </Typography>
                
                {/* Budget Display */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    Budget: {formatKWD(budget || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
                    Total amount to be charged
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Package Name:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {packageData?.name || 'Unknown Package'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Duration:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Timer />
                      {packageData?.duration || 0}s
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Price per View:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatKWD(packageData?.pricePerView || packageData?.price_per_view || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Budget:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatKWD(budget || 0)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Total Amount:
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatKWD(budget || 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            {/* Customer Details */}
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Customer Information
            </Typography>

            <TextField
              fullWidth
              label="Customer Name"
              value={formData.customerName}
              onChange={handleInputChange('customerName')}
              error={!!formErrors.customerName}
              helperText={formErrors.customerName}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Customer Email"
              type="email"
              value={formData.customerEmail}
              onChange={handleInputChange('customerEmail')}
              error={!!formErrors.customerEmail}
              helperText={formErrors.customerEmail}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Customer Mobile"
              value={formData.customerMobile}
              onChange={handleInputChange('customerMobile')}
              error={!!formErrors.customerMobile}
              helperText={formErrors.customerMobile || 'Format: +96512345678'}
              placeholder="+965 12345678"
              sx={{ mb: 2 }}
            />

            {/* Payment Gateway Info */}
            <Card sx={{ mt: 2, bgcolor: 'info.light', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Gateway
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">
                    Gateway:
                  </Typography>
                  <Chip 
                    label="MyFatoorah" 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Payment...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Please wait while we process your package purchase
            </Typography>
            
            {paymentSession && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Session ID: {paymentSession.sessionId}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Amount: {paymentSession.amount} KWD
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Package: {paymentSession?.package?.name || 'Unknown'}
                </Typography>
              </Box>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {paymentStatus === 'success' ? (
              <>
                <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Package Purchase Successful!
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Your package {packageData?.name || 'package'} has been purchased and is ready to use
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    icon={<TrendingUp />}
                    label="Package Activated" 
                    color="success" 
                    variant="outlined"
                  />
                </Box>
              </>
            ) : (
              <>
                <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Payment Failed
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Please try again or contact support
                </Typography>
              </>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  console.log('🔍 PackagePaymentModal - About to return JSX');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ShoppingCart color="primary" />
          <Typography variant="h6">Purchase Package</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        {activeStep === 0 && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              startIcon={<Person />}
            >
              Continue
            </Button>
          </>
        )}
        
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="contained"
              onClick={handleCreatePayment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
            >
              {loading ? 'Creating...' : 'Create Payment'}
            </Button>
          </>
        )}
        
        {activeStep === 3 && (
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
